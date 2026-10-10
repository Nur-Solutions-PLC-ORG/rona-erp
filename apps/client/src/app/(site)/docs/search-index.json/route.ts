import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  DOC_GROUPS,
  slugify,
  type SearchPage,
  type SearchSection,
} from "../(sections)/search-config";

// Built from the docs page sources, so search never drifts from the content.
// Prerendered at build time; recomputed per request in dev.
export const dynamic = "force-static";

const DOCS_DIR = path.join(process.cwd(), "src/app/(site)/docs/(sections)");
const MAX_TEXT = 2000;

const ENTITIES: Record<string, string> = {
  "&apos;": "'",
  "&quot;": '"',
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&rarr;": "→",
  "&nbsp;": " ",
};

function decode(text: string) {
  return text.replace(/&[a-z]+;/g, (entity) => ENTITIES[entity] ?? " ");
}

function squash(text: string) {
  return decode(text).replace(/\s+/g, " ").trim();
}

/** Readable text of a JSX fragment: string literals plus JSX text nodes. */
function jsxText(source: string) {
  const cleaned = source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/className=(?:"[^"]*"|\{`[^`]*`\}|\{[^{}]*\})/g, " ")
    .replace(/\b(?:href|tone|icon|variant|key)=(?:"[^"]*"|\{[^{}]*\})/g, " ");

  const literals = [
    ...cleaned.matchAll(/"([^"\n]*[A-Za-z][^"\n]*)"|`([^`]*[A-Za-z][^`]*)`/g),
  ].map((match) => match[1] ?? match[2]);

  // JSX text nodes: drop literals (collected above), then code expressions.
  let textNodes = cleaned.replace(/"[^"\n]*"|`[^`]*`/g, " ");
  let previous = "";
  while (previous !== textNodes) {
    previous = textNodes;
    textNodes = textNodes.replace(/\{[^{}]*\}/g, " ");
  }
  textNodes = textNodes.replace(/<[^>]*>/g, " ");

  return squash([...literals, textNodes].join(" ")).slice(0, MAX_TEXT);
}

function attr(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`${name}=(?:"([^"]*)"|\\{\\s*"([^"]*)"\\s*\\})`),
  );
  return match ? squash(match[1] ?? match[2]) : "";
}

function parsePage(file: string, source: string): SearchPage | null {
  const rel = path.relative(DOCS_DIR, file).split(path.sep);
  const segments = rel.slice(0, -1);
  if (segments.length === 0) return null; // the hub itself

  const group =
    DOC_GROUPS.find((item) => item.segment === segments[0])?.label ??
    segments[0];

  const metadata = source.match(
    /export const metadata\s*=\s*\{([\s\S]*?)\n\};/,
  );
  const metaTitle = metadata ? attrLike(metadata[1], "title") : "";
  const metaDescription = metadata ? attrLike(metadata[1], "description") : "";

  const header = source.match(/<DocHeader[\s\S]*?\/>/)?.[0] ?? "";
  const title = attr(header, "title") || metaTitle || segments.at(-1)!;
  const lede = attr(header, "lede");

  const bodyStart = source.indexOf("export default function");
  const preamble = bodyStart > 0 ? source.slice(0, bodyStart) : "";
  const body = bodyStart > 0 ? source.slice(bodyStart) : source;

  const sections: SearchSection[] = [];
  const sectionRe = /<Section\s+title=(?:"([^"]*)"|\{\s*"([^"]*)"\s*\})\s*>/g;
  const starts = [...body.matchAll(sectionRe)];
  starts.forEach((match, index) => {
    const sectionTitle = squash(match[1] ?? match[2]);
    const from = match.index! + match[0].length;
    const to = starts[index + 1]?.index ?? body.length;
    const chunk = body.slice(from, to);
    sections.push({
      id: slugify(sectionTitle),
      title: sectionTitle,
      text: jsxText(chunk),
    });
    // Plain-string <H3> headings become their own anchors.
    for (const h3 of chunk.matchAll(/<H3>([^<{]+)<\/H3>/g)) {
      const h3Title = squash(h3[1]);
      sections.push({
        id: slugify(h3Title),
        title: `${sectionTitle} › ${h3Title}`,
        text: "",
      });
    }
  });

  // Data arrays above the component (tables, lists) are searchable page text.
  const pageText = jsxText(
    preamble
      .replace(/export const metadata[\s\S]*?\n\};/, " ")
      .replace(/^import[\s\S]*?;$/gm, " "),
  );

  return {
    href: `/docs/${segments.join("/")}`,
    group,
    title,
    description: squash(
      [
        metaTitle !== title ? metaTitle : "",
        metaDescription,
        lede,
        pageText,
      ].join(" "),
    ).slice(0, MAX_TEXT),
    sections,
  };
}

/** `key: "value"` or `key:\n "value"` inside an object literal. */
function attrLike(source: string, key: string) {
  const match = source.match(new RegExp(`${key}:\\s*"([^"]*)"`));
  return match ? squash(match[1]) : "";
}

function order(page: SearchPage, eyebrowIndex: Map<string, number>) {
  const groupIndex = DOC_GROUPS.findIndex((item) => item.label === page.group);
  return (
    (groupIndex < 0 ? 99 : groupIndex) * 100 +
    (eyebrowIndex.get(page.href) ?? 50)
  );
}

export function GET() {
  const files = (fs.readdirSync(DOCS_DIR, { recursive: true }) as string[])
    .filter((file) => file.endsWith("page.tsx"))
    .map((file) => path.join(DOCS_DIR, file));

  const eyebrowIndex = new Map<string, number>();
  const pages: SearchPage[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const page = parsePage(file, source);
    if (!page) continue;
    const eyebrow = source.match(/eyebrow="[^"]*?(\d+)"/);
    if (eyebrow) eyebrowIndex.set(page.href, Number(eyebrow[1]));
    pages.push(page);
  }

  pages.sort((a, b) => order(a, eyebrowIndex) - order(b, eyebrowIndex));
  return NextResponse.json({ pages });
}
