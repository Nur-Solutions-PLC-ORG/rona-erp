import type { AiExportFormat, AiReportType } from '@rona/types/ai';
import type { RonaContextBundle } from '../types/ai-contexts.types.js';

export const REPORT_EXTENSIONS: Record<AiExportFormat, string> = {
  pdf: 'pdf',
  excel: 'xlsx',
  json: 'json',
};

export type ColumnAlign = 'left' | 'right';

export interface ReportTable {
  name: string;
  columns: string[];
  aligns?: ColumnAlign[];
  rows: unknown[][];
}

export interface ReportDocument {
  title: string;
  tenantLabel: string;
  periodLabel: string;
  generatedAt: Date;
  sourceSystem: string;
  summary: Array<[string, string]>;
  tables: ReportTable[];
}

export type DocumentParts = [string, Array<[string, string]>, ReportTable[]];

export type DocumentBuilder = (bundle: RonaContextBundle) => DocumentParts;

export class ReportDataUnavailableError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const REPORT_REQUIRED_DOMAIN: Record<AiReportType, string | null> = {
  attendance: 'attendance',
  production: 'production',
  inventory_valuation: 'inventory',
  quality: 'quality',
  sales: 'sales',
  finance: 'finance',
  management_summary: null,
};
