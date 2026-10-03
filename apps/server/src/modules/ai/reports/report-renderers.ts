import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import type { AiExportFormat } from '@rona/types/ai';
import type {
  ColumnAlign,
  ReportDocument,
  ReportTable,
} from './report-models.js';

const NOT_AVAILABLE = 'N/A';

const BARE_INT = /^[1-9]\d{3,}$/;
const BARE_DECIMAL = /^([1-9]\d{3,})\.(\d+)$/;

export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return NOT_AVAILABLE;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return NOT_AVAILABLE;
    return value.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? NOT_AVAILABLE
      : value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string') {
    try {
      return JSON.stringify(value) ?? NOT_AVAILABLE;
    } catch {
      return NOT_AVAILABLE;
    }
  }
  const text = value.trim();
  if (text.length === 0) return NOT_AVAILABLE;
  if (BARE_INT.test(text)) return Number(text).toLocaleString('en-US');
  const decimal = text.match(BARE_DECIMAL);
  if (decimal) {
    return `${Number(decimal[1]).toLocaleString('en-US')}.${decimal[2]}`;
  }
  return text;
}

const alignOf = (table: ReportTable, index: number): ColumnAlign =>
  table.aligns?.[index] ?? 'left';

export function renderJson(document: ReportDocument): Buffer {
  const payload = {
    title: document.title,
    tenant: document.tenantLabel,
    period: document.periodLabel,
    generated_at: document.generatedAt.toISOString(),
    source_system: document.sourceSystem,
    summary: document.summary.map(([label, value]) => ({ label, value })),
    tables: document.tables.map((table) => ({
      name: table.name,
      columns: table.columns,
      rows: table.rows,
    })),
  };
  return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
}

const INDIGO_SOFT = 'FFEEF2FF';
const CHARCOAL = 'FF1E293B';
const SLATE = 'FF64748B';
const BORDER_GRAY = 'FFE0E4EA';
const ZEBRA = 'FFF8FAFC';

const sheetName = (value: string, suffix = ''): string =>
  `${value}${suffix}`
    .replace(/[[\]:*?/\\]/g, ' ')
    .trim()
    .slice(0, 31) || 'Sheet';

export async function renderExcel(document: ReportDocument): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Rona ERP';
  workbook.created = document.generatedAt;

  const overview = workbook.addWorksheet(sheetName('Report'));
  overview.columns = [{ width: 32 }, { width: 64 }];
  overview.mergeCells('A1:B1');
  const titleCell = overview.getCell('A1');
  titleCell.value = document.title;
  titleCell.font = { bold: true, size: 16, color: { argb: CHARCOAL } };

  overview.mergeCells('A2:B2');
  const metaCell = overview.getCell('A2');
  metaCell.value = `${document.tenantLabel} · ${document.periodLabel}`;
  metaCell.font = { size: 10, color: { argb: SLATE } };

  overview.mergeCells('A3:B3');
  const genCell = overview.getCell('A3');
  genCell.value = `Generated ${document.generatedAt.toISOString()} · Source: ${document.sourceSystem}`;
  genCell.font = { size: 9, color: { argb: SLATE } };

  const headerRow = overview.getRow(5);
  headerCell(headerRow.getCell(1), 'Metric');
  headerCell(headerRow.getCell(2), 'Value');
  headerRow.commit();

  document.summary.forEach(([label, value], index) => {
    const row = overview.getRow(6 + index);
    row.getCell(1).value = label;
    row.getCell(2).value = formatCell(value);
    row.getCell(2).alignment = { horizontal: 'right' };
    if (index % 2 === 1) {
      for (const cell of [row.getCell(1), row.getCell(2)]) {
        cell.fill = zebraFill();
      }
    }
    row.getCell(1).font = { size: 10 };
    row.getCell(2).font = { bold: true, size: 10 };
    row.commit();
  });

  for (const table of document.tables) {
    const sheet = workbook.addWorksheet(sheetName(table.name));
    const nameRow = sheet.getRow(1);
    nameRow.getCell(1).value = table.name;
    nameRow.getCell(1).font = {
      bold: true,
      size: 13,
      color: { argb: CHARCOAL },
    };
    nameRow.commit();

    const head = sheet.getRow(3);
    table.columns.forEach((column, index) => {
      headerCell(head.getCell(index + 1), column);
    });
    head.commit();

    const widths = table.columns.map((column, index) => {
      const lengths = table.rows.map((row) => formatCell(row[index]).length);
      return Math.min(42, Math.max(12, column.length, ...lengths));
    });
    sheet.columns = widths.map((width) => ({ width }));

    table.rows.forEach((row, rowIndex) => {
      const sheetRow = sheet.getRow(4 + rowIndex);
      table.columns.forEach((_, columnIndex) => {
        const cell = sheetRow.getCell(columnIndex + 1);
        const raw = row[columnIndex];
        if (
          typeof raw === 'number' &&
          Number.isFinite(raw) &&
          alignOf(table, columnIndex) === 'right'
        ) {
          cell.value = raw;
          cell.numFmt = '#,##0.00';
        } else {
          cell.value = formatCell(raw);
        }
        cell.font = { size: 10 };
        cell.alignment = {
          horizontal:
            alignOf(table, columnIndex) === 'right' ? 'right' : 'left',
        };
        if (rowIndex % 2 === 1) cell.fill = zebraFill();
      });
      sheetRow.commit();
    });

    sheet.views = [{ state: 'frozen', ySplit: 3 }];
  }

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}

function headerCell(cell: ExcelJS.Cell, text: string): void {
  cell.value = text;
  cell.font = { bold: true, size: 10, color: { argb: CHARCOAL } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: INDIGO_SOFT },
  };
  cell.border = {
    bottom: { style: 'thin', color: { argb: BORDER_GRAY } },
  };
}

function zebraFill(): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: ZEBRA },
  };
}

const PAGE_MARGIN = 48;
const INK = '#0f172a';
const ACCENT = '#4f46e5';
const ACCENT_SOFT = '#eef2ff';
const HEADING = '#334155';
const MUTED = '#64748b';
const FAINT = '#94a3b8';
const BORDER = '#e2e8f0';
const ZEBRA_BG = '#f8fafc';
const CANVAS = '#f1f5f9';

interface TableSpec {
  aligns: ColumnAlign[];
  widths: number[];
  header: string[];
  rows: string[][];
  title?: string;
}

function textAt(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  options: {
    size: number;
    color: string;
    bold?: boolean;
    oblique?: boolean;
    width?: number;
    align?: 'left' | 'right' | 'center';
    characterSpacing?: number;
  },
): void {
  doc.save();
  doc
    .font(
      options.bold
        ? 'Helvetica-Bold'
        : options.oblique
          ? 'Helvetica-Oblique'
          : 'Helvetica',
    )
    .fontSize(options.size)
    .fillColor(options.color);
  doc.text(text, x, y, {
    lineBreak: false,
    width: options.width ?? doc.page.width - x - PAGE_MARGIN,
    align: options.align ?? 'left',
    characterSpacing: options.characterSpacing,
  });
  doc.restore();
  doc.x = PAGE_MARGIN;
  doc.y = y;
}

function fitText(
  doc: PDFKit.PDFDocument,
  text: string,
  maxWidth: number,
  size: number,
  bold = false,
): string {
  doc.save();
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size);
  let content = text;
  if (doc.widthOfString(content) > maxWidth) {
    while (
      content.length > 1 &&
      doc.widthOfString(`${content}...`) > maxWidth
    ) {
      content = content.slice(0, -1);
    }
    content = `${content}...`;
  }
  doc.restore();
  return content;
}

function tableSpec(
  table: ReportTable,
  usableWidth: number,
  doc: PDFKit.PDFDocument,
): TableSpec {
  const header = table.columns.map((column) => column.trim() || ' ');
  const rows = table.rows.map((row) => row.map((cell) => formatCell(cell)));

  doc.save();
  doc.font('Helvetica').fontSize(8);
  const widthOf = (text: string) => doc.widthOfString(text);
  const widths = header.map((column, index) => {
    const cellWidths = rows.map((row) => widthOf(row[index] ?? ''));
    return Math.min(180, Math.max(widthOf(column), ...cellWidths, 40));
  });
  doc.restore();

  const totalWeight = widths.reduce((sum, width) => sum + width, 0);
  const columnWidths = widths.map(
    (width) => (width / totalWeight) * usableWidth,
  );

  return {
    aligns: table.columns.map((_, index) => alignOf(table, index)),
    widths: columnWidths,
    header,
    rows,
    title: table.name,
  };
}

function accentRule(
  doc: PDFKit.PDFDocument,
  y: number,
  usableWidth: number,
): void {
  doc.save();
  doc.rect(PAGE_MARGIN, y, 28, 2.5).fill(ACCENT);
  doc
    .moveTo(PAGE_MARGIN, y + 3.25)
    .lineTo(PAGE_MARGIN + usableWidth, y + 3.25)
    .lineWidth(0.75)
    .strokeColor(BORDER)
    .stroke();
  doc.restore();
}

const usableWidthOf = (doc: PDFKit.PDFDocument): number =>
  doc.page.width - PAGE_MARGIN * 2;

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  spec: TableSpec,
  usableWidth: number,
): void {
  const y = doc.y;
  doc.save();
  doc.rect(PAGE_MARGIN, y, usableWidth, ROW_HEIGHT).fill(ACCENT_SOFT);
  doc.restore();

  let x = PAGE_MARGIN;
  spec.header.forEach((column, index) => {
    const width = spec.widths[index];
    const content = fitText(doc, column, width - 14, 8, true);
    const cx =
      spec.aligns[index] === 'right'
        ? x + width - 7 - doc.widthOfString(content)
        : x + 7;
    textAt(doc, content, cx, y + 5, {
      size: 8,
      color: HEADING,
      bold: true,
    });
    x += width;
  });

  doc.save();
  doc
    .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
    .lineTo(PAGE_MARGIN + usableWidth, y + ROW_HEIGHT)
    .lineWidth(0.9)
    .strokeColor(ACCENT)
    .stroke();
  doc.restore();

  doc.y = y + ROW_HEIGHT;
}

const ROW_HEIGHT = 17;
const FOOTER_RESERVE = PAGE_MARGIN + 30;

function ensureSpace(
  doc: PDFKit.PDFDocument,
  height: number,
  spec?: TableSpec,
): void {
  if (doc.y + height > doc.page.height - FOOTER_RESERVE) {
    doc.addPage();
    if (spec) {
      textAt(doc, `${spec.title ?? 'Table'} (continued)`, PAGE_MARGIN, doc.y, {
        size: 7.5,
        color: FAINT,
        oblique: true,
      });
      doc.y += 14;
      drawTableHeader(doc, spec, usableWidthOf(doc));
    }
  }
}

function drawTable(
  doc: PDFKit.PDFDocument,
  spec: TableSpec,
  usableWidth: number,
): void {
  drawTableHeader(doc, spec, usableWidth);

  spec.rows.forEach((row, rowIndex) => {
    ensureSpace(doc, ROW_HEIGHT, spec);
    const y = doc.y;

    if (rowIndex % 2 === 1) {
      doc.save();
      doc.rect(PAGE_MARGIN, y, usableWidth, ROW_HEIGHT).fill(ZEBRA_BG);
      doc.restore();
    }
    doc.save();
    doc
      .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
      .lineTo(PAGE_MARGIN + usableWidth, y + ROW_HEIGHT)
      .lineWidth(0.5)
      .strokeColor(BORDER)
      .stroke();
    doc.restore();

    let x = PAGE_MARGIN;
    row.forEach((cell, index) => {
      const width = spec.widths[index];
      const content = fitText(doc, cell, width - 14, 8);
      doc.save();
      doc.font('Helvetica').fontSize(8);
      const cx =
        spec.aligns[index] === 'right'
          ? x + width - 7 - doc.widthOfString(content)
          : x + 7;
      doc.restore();
      textAt(doc, content, cx, y + 5, { size: 8, color: INK });
      x += width;
    });

    doc.y = y + ROW_HEIGHT;
  });
  doc.y += 16;
}

function sectionTitle(doc: PDFKit.PDFDocument, text: string): void {
  const usableWidth = usableWidthOf(doc);
  ensureSpace(doc, 56);
  doc.y += 10;
  const y = doc.y;
  textAt(doc, text, PAGE_MARGIN, y, { size: 12, color: INK, bold: true });
  accentRule(doc, y + 15, usableWidth);
  doc.y = y + 28;
}

function drawMetricCards(
  doc: PDFKit.PDFDocument,
  summary: Array<[string, string]>,
  usableWidth: number,
): void {
  const columns = 3;
  const gap = 10;
  const cardWidth = (usableWidth - gap * (columns - 1)) / columns;
  const cardHeight = 46;

  for (let i = 0; i < summary.length; i += columns) {
    const slice = summary.slice(i, i + columns);
    ensureSpace(doc, cardHeight + gap);
    const top = doc.y;

    slice.forEach(([label, value], index) => {
      const x = PAGE_MARGIN + index * (cardWidth + gap);

      doc.save();
      doc.roundedRect(x, top, cardWidth, cardHeight, 4).fill(CANVAS);
      doc.rect(x, top + 4, 2.5, cardHeight - 8).fill(ACCENT);
      doc
        .roundedRect(x, top, cardWidth, cardHeight, 4)
        .lineWidth(0.75)
        .strokeColor(BORDER)
        .stroke();
      doc.restore();

      textAt(
        doc,
        fitText(doc, label.toUpperCase(), cardWidth - 24, 7),
        x + 12,
        top + 10,
        {
          size: 7,
          color: MUTED,
          characterSpacing: 0.5,
        },
      );
      textAt(
        doc,
        fitText(doc, formatCell(value), cardWidth - 24, 11, true),
        x + 12,
        top + 22,
        { size: 11, color: INK, bold: true },
      );
    });
    doc.y = top + cardHeight + gap;
  }
  doc.y += 6;
}

export async function renderPdf(document: ReportDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
      bufferPages: true,
      info: {
        Title: document.title,
        Author: 'Rona ERP',
        Subject: `${document.tenantLabel} — ${document.periodLabel}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const usableWidth = doc.page.width - PAGE_MARGIN * 2;

    const bandHeight = 86;
    doc.save();
    doc.rect(0, 0, doc.page.width, bandHeight).fill(CANVAS);
    doc.rect(0, 0, 6, bandHeight).fill(ACCENT);
    doc.restore();

    textAt(doc, 'RONA ERP · OPERATIONAL REPORT', PAGE_MARGIN + 4, 18, {
      size: 8,
      color: ACCENT,
      bold: true,
      characterSpacing: 1.5,
    });

    textAt(
      doc,
      fitText(doc, document.title, usableWidth - 8, 21, true),
      PAGE_MARGIN + 4,
      32,
      { size: 21, color: INK, bold: true },
    );

    textAt(
      doc,
      fitText(
        doc,
        `${document.tenantLabel}  ·  ${document.periodLabel}`,
        usableWidth - 8,
        9.5,
      ),
      PAGE_MARGIN + 4,
      60,
      { size: 9.5, color: MUTED },
    );

    textAt(
      doc,
      `Generated ${document.generatedAt
        .toISOString()
        .slice(0, 16)
        .replace('T', ' ')} UTC  ·  Source: ${document.sourceSystem}`,
      PAGE_MARGIN + 4,
      72,
      { size: 7.5, color: FAINT },
    );

    doc.x = PAGE_MARGIN;
    doc.y = bandHeight + 26;

    if (document.summary.length) {
      sectionTitle(doc, 'Key Metrics');
      drawMetricCards(doc, document.summary, usableWidth);
    }

    for (const table of document.tables) {
      sectionTitle(doc, table.name);
      if (!table.rows.length) {
        const y = doc.y;
        textAt(doc, 'No records for this period.', PAGE_MARGIN, y, {
          size: 9,
          color: MUTED,
          oblique: true,
        });
        doc.y = y + 18;
        continue;
      }
      drawTable(doc, tableSpec(table, usableWidth, doc), usableWidth);
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      const footerY = doc.page.height - PAGE_MARGIN - 12;
      doc.save();
      doc
        .moveTo(PAGE_MARGIN, footerY)
        .lineTo(doc.page.width - PAGE_MARGIN, footerY)
        .lineWidth(0.75)
        .strokeColor(BORDER)
        .stroke();
      doc.restore();

      const leftText = fitText(
        doc,
        `Rona ERP  ·  ${document.tenantLabel}`,
        usableWidth / 2 - 8,
        7.5,
      );
      textAt(doc, leftText, PAGE_MARGIN, footerY + 4, {
        size: 7.5,
        color: MUTED,
      });

      const rightText = fitText(
        doc,
        `${document.periodLabel}  ·  Page ${i - range.start + 1} of ${range.count}`,
        usableWidth / 2 - 8,
        7.5,
      );
      doc.save();
      doc.font('Helvetica').fontSize(7.5);
      const rightX =
        doc.page.width - PAGE_MARGIN - doc.widthOfString(rightText);
      doc.restore();
      textAt(doc, rightText, rightX, footerY + 4, {
        size: 7.5,
        color: MUTED,
      });
    }

    doc.end();
  });
}

export async function render(
  document: ReportDocument,
  format: AiExportFormat,
): Promise<Buffer> {
  switch (format) {
    case 'json':
      return renderJson(document);
    case 'excel':
      return renderExcel(document);
    case 'pdf':
      return renderPdf(document);
    default:
      throw new Error('Unsupported export format');
  }
}
