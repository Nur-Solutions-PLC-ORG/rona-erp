import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Lightbulb,
} from "lucide-react";

export const hairline = "border-[#581c87]";

export const serif =
  "font-heading tracking-[-0.01em]";

type Tone = "info" | "warn" | "ok";

const toneBg: Record<Tone, string> = {
  info: "bg-[#f3eefb]",
  warn: "bg-[#fdeeca]",
  ok: "bg-[#e8f5e9]",
};

const statusTones: Record<string, string> = {
  DRAFT: "bg-white text-[#5c4d77]",
  SCHEDULED: "bg-white text-[#5c4d77]",
  PENDING: "bg-white text-[#5c4d77]",
  PROCESSING: "bg-[#f3eefb] text-[#581c87]",
  READY: "bg-[#581c87] text-white",
  APPROVED: "bg-[#581c87] text-white",
  CONFIRMED: "bg-[#581c87] text-white",
  ACTIVE: "bg-[#581c87] text-white",
  ISSUED: "bg-[#581c87] text-white",
  FULFILLED: "bg-[#581c87] text-white",
  COMPLETED: "bg-[#581c87] text-white",
  PAID: "bg-[#581c87] text-white",
  IN_PROGRESS: "bg-[#f3eefb] text-[#581c87]",
  FULFILLING: "bg-[#f3eefb] text-[#581c87]",
  PARTIALLY_PAID: "bg-[#fdeeca] text-[#581c87]",
  CANCELLED: "bg-[#fdeeca] text-[#581c87]",
  REJECTED: "bg-[#fdeeca] text-[#581c87]",
  VOID: "bg-[#fdeeca] text-[#581c87]",
  RETIRED: "bg-[#fdeeca] text-[#581c87]",
  QUARANTINED: "bg-[#fdeeca] text-[#581c87]",
  FAILED: "bg-[#fdeeca] text-[#581c87]",
};

export function Pill({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex border ${hairline} px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${
        statusTones[label] ?? "bg-white text-[#581c87]"
      }`}
    >
      {label}
    </span>
  );
}

export function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((tag) => (
        <span
          key={tag}
          className={`border ${hairline} bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-[#581c87]`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function DocHeader({
  eyebrow,
  title,
  lede,
  tags,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  tags?: string[];
}) {
  return (
    <header className={`border-b-2 ${hairline} pb-8`}>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7c6f96]">
        {eyebrow}
      </span>
      <h1
        className={`mt-3 text-3xl font-semibold leading-tight text-[#581c87] sm:text-4xl ${serif}`}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#5c4d77]">
        {lede}
      </p>
      {tags ? (
        <div className="mt-5">{tags && <Tags items={tags} />}</div>
      ) : null}
    </header>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2
        className={`text-2xl font-semibold text-[#581c87] sm:text-[1.7rem] ${serif}`}
      >
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold text-[#581c87]">{children}</h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13.5px] leading-relaxed text-[#5c4d77]">{children}</p>
  );
}

export function Card({
  title,
  icon: Icon,
  tone,
  shadow,
  children,
  className,
}: {
  title?: string;
  icon?: LucideIcon;
  tone?: Tone;
  shadow?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${shadow ? `border-2 ${hairline} shadow-[4px_4px_0_0_#581c87]` : `border ${hairline}`} ${
        tone ? toneBg[tone] : "bg-white"
      } p-5 ${className ?? ""}`}
    >
      {title ? (
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span
              className={`flex h-7 w-7 items-center justify-center border ${hairline} bg-white`}
            >
              <Icon className="h-4 w-4 text-[#581c87]" strokeWidth={1.5} />
            </span>
          ) : null}
          <h3 className="text-[14px] font-semibold text-[#581c87]">{title}</h3>
        </div>
      ) : null}
      {title ? <div className="mt-3">{children}</div> : children}
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  icon,
  children,
}: {
  tone?: Tone;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  const Icon =
    icon ??
    (tone === "warn" ? AlertTriangle : tone === "ok" ? CheckCircle2 : Info);
  return (
    <div className={`border-2 ${hairline} ${toneBg[tone]} p-5`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center border ${hairline} bg-white`}
        >
          <Icon className="h-4 w-4 text-[#581c87]" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#581c87]">
            {title}
          </h3>
          <div className="mt-2 text-[13.5px] leading-relaxed text-[#5c4d77]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckList({
  items,
  columns,
}: {
  items: string[];
  columns?: 1 | 2;
}) {
  return (
    <ul
      className={`space-y-2.5 ${columns === 2 ? "sm:grid sm:grid-cols-2 sm:gap-x-6 sm:space-y-0" : ""}`}
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-[13.5px] text-[#4a3a68]"
        >
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-[#581c87]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function FieldTable({
  label,
  rows,
}: {
  label: string;
  rows: { field: string; description: string }[];
}) {
  return (
    <div className={`overflow-hidden border ${hairline} bg-white`}>
      <div
        className={`border-b ${hairline} bg-[#f3eefb] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#581c87]`}
      >
        {label}
      </div>
      <table className="w-full text-left">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.field}
              className={`border-b ${hairline} last:border-b-0 hover:bg-[#f9f7fd]`}
            >
              <td className="w-2/5 px-4 py-2.5 align-top font-mono text-[11.5px] font-semibold text-[#581c87]">
                {row.field}
              </td>
              <td className="px-4 py-2.5 align-top text-[12.5px] leading-relaxed text-[#5c4d77]">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusFlow({ steps }: { steps: string[] }) {
  return (
    <div className={`border-2 ${hairline} bg-white p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <Pill label={step} />
            {i < steps.length - 1 ? (
              <ArrowRight className="h-3.5 w-3.5 text-[#a893c9]" />
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Steps({
  items,
}: {
  items: { title: string; body?: string }[];
}) {
  return (
    <div className={`border ${hairline} bg-white`}>
      {items.map((item, i) => (
        <div
          key={item.title}
          className={`flex items-start gap-4 border-b ${hairline} p-4 last:border-b-0 hover:bg-[#f9f7fd]`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#581c87] bg-white font-mono text-[11px] font-bold text-[#581c87]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-[13.5px] font-semibold text-[#581c87]">
              {item.title}
            </h3>
            {item.body ? (
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#5c4d77]">
                {item.body}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className={`overflow-hidden border-2 ${hairline} bg-white`}>
      <div
        className={`flex items-center justify-between border-b ${hairline} bg-[#f3eefb] px-3 py-1.5`}
      >
        <div className="flex gap-1.5">
          <span className={`h-2.5 w-2.5 border ${hairline} bg-white`} />
          <span className={`h-2.5 w-2.5 border ${hairline} bg-white`} />
          <span className={`h-2.5 w-2.5 border ${hairline} bg-[#581c87]`} />
        </div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#6c5f8a]">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto bg-[#f9f7fd] p-4 font-mono text-[12px] leading-relaxed text-[#581c87]">
        {code}
      </pre>
    </div>
  );
}

export function Exchange({
  prompt,
  response,
}: {
  prompt: string;
  response: string;
}) {
  return (
    <div className={`border ${hairline} bg-white p-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 border ${hairline} bg-[#581c87] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white`}
        >
          You
        </span>
        <p className="text-[13px] font-medium text-[#581c87]">{prompt}</p>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <span
          className={`shrink-0 border ${hairline} bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-[#581c87]`}
        >
          AI
        </span>
        <p className="text-[12.5px] leading-relaxed text-[#4a3a68]">
          {response}
        </p>
      </div>
    </div>
  );
}

export function QuoteList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className={`border-l-2 ${hairline} bg-white px-3 py-1.5 font-mono text-[12px] text-[#4a3a68]`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

const methodTones: Record<string, string> = {
  GET: "bg-white text-[#581c87]",
  POST: "bg-[#581c87] text-white",
  PATCH: "bg-[#f3eefb] text-[#581c87]",
  DELETE: "bg-[#fdeeca] text-[#581c87]",
};

export function Endpoint({
  method,
  path,
  description,
  permission,
}: {
  method: string;
  path: string;
  description: string;
  permission: string;
}) {
  return (
    <div className={`border ${hairline} bg-white p-4 hover:bg-[#f9f7fd]`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`border ${hairline} px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest ${
            methodTones[method] ?? "bg-white text-[#581c87]"
          }`}
        >
          {method}
        </span>
        <span className="font-mono text-[13px] font-semibold text-[#581c87]">
          {path}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-[#5c4d77]">
        {description}
      </p>
      <div className="mt-2.5">
        <Tags items={[permission]} />
      </div>
    </div>
  );
}

export function NextSteps({
  title,
  body,
  links,
}: {
  title: string;
  body: string;
  links: { label: string; href: string; primary?: boolean }[];
}) {
  return (
    <div className={`mt-12 border-2 ${hairline} bg-[#f9f7fd] p-6`}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#7c6f96]">
        Continue
      </span>
      <h2 className={`mt-2 text-2xl font-semibold text-[#581c87] ${serif}`}>
        {title}
      </h2>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-[#5c4d77]">
        {body}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) =>
          link.primary ? (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-2 border border-[#581c87] bg-[#581c87] px-4 py-2 text-[13px] font-semibold text-white hover:bg-white hover:text-[#581c87]"
            >
              {link.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 border border-[#581c87] bg-white px-4 py-2 text-[13px] font-semibold text-[#581c87] hover:bg-[#581c87] hover:text-white"
            >
              {link.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export function Pager({
  prev,
  next,
}: {
  prev?: { label: string; href: string };
  next?: { label: string; href: string };
}) {
  return (
    <nav className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className={`group flex items-center gap-3 border ${hairline} bg-white p-4 hover:bg-[#581c87] hover:text-white`}
        >
          <ArrowRight className="h-4 w-4 rotate-180 text-[#581c87] group-hover:text-white" />
          <span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#7c6f96] group-hover:text-[#e4dcf5]">
              Previous
            </span>
            <span className="text-[13px] font-semibold text-[#581c87] group-hover:text-white">
              {prev.label}
            </span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className={`group flex items-center justify-end gap-3 border ${hairline} bg-white p-4 text-right hover:bg-[#581c87] hover:text-white`}
        >
          <span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-[#7c6f96] group-hover:text-[#e4dcf5]">
              Next
            </span>
            <span className="text-[13px] font-semibold text-[#581c87] group-hover:text-white">
              {next.label}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-[#581c87] group-hover:text-white" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function TipCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Callout tone="info" title={title} icon={Lightbulb}>
      {children}
    </Callout>
  );
}
