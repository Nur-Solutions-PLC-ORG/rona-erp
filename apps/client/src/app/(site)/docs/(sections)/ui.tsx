import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Lightbulb,
} from "lucide-react";

export const hairline = "border-ink";

export const serif =
  "font-heading tracking-[-0.01em]";

type Tone = "info" | "warn" | "ok";

const toneBg: Record<Tone, string> = {
  info: "bg-tint",
  warn: "bg-warn-soft",
  ok: "bg-emerald-50",
};

const statusTones: Record<string, string> = {
  DRAFT: "bg-card text-ink-2",
  SCHEDULED: "bg-card text-ink-2",
  PENDING: "bg-card text-ink-2",
  PROCESSING: "bg-tint text-ink",
  READY: "bg-ink text-card",
  APPROVED: "bg-ink text-card",
  CONFIRMED: "bg-ink text-card",
  ACTIVE: "bg-ink text-card",
  ISSUED: "bg-ink text-card",
  FULFILLED: "bg-ink text-card",
  COMPLETED: "bg-ink text-card",
  PAID: "bg-ink text-card",
  IN_PROGRESS: "bg-tint text-ink",
  FULFILLING: "bg-tint text-ink",
  PARTIALLY_PAID: "bg-warn-soft text-ink",
  CANCELLED: "bg-warn-soft text-ink",
  REJECTED: "bg-warn-soft text-ink",
  VOID: "bg-warn-soft text-ink",
  RETIRED: "bg-warn-soft text-ink",
  QUARANTINED: "bg-warn-soft text-ink",
  FAILED: "bg-warn-soft text-ink",
};

export function Pill({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex border ${hairline} px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${
        statusTones[label] ?? "bg-card text-ink"
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
          className={`border ${hairline} bg-card px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-ink`}
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
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
        {eyebrow}
      </span>
      <h1
        className={`mt-3 text-3xl font-semibold leading-tight text-ink sm:text-4xl ${serif}`}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">
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
        className={`text-2xl font-semibold text-ink sm:text-[1.7rem] ${serif}`}
      >
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold text-ink">{children}</h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13.5px] leading-relaxed text-ink-2">{children}</p>
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
      className={`${shadow ? `border-2 ${hairline} shadow-[4px_4px_0_0_var(--ink)]` : `border ${hairline}`} ${
        tone ? toneBg[tone] : "bg-card"
      } p-5 ${className ?? ""}`}
    >
      {title ? (
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span
              className={`flex h-7 w-7 items-center justify-center border ${hairline} bg-card`}
            >
              <Icon className="h-4 w-4 text-ink" strokeWidth={1.5} />
            </span>
          ) : null}
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
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
          className={`flex h-7 w-7 shrink-0 items-center justify-center border ${hairline} bg-card`}
        >
          <Icon className="h-4 w-4 text-ink" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink">
            {title}
          </h3>
          <div className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
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
          className="flex items-start gap-2.5 text-[13.5px] text-ink-2"
        >
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-ink" />
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
    <div className={`overflow-hidden border ${hairline} bg-card`}>
      <div
        className={`border-b ${hairline} bg-tint px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink`}
      >
        {label}
      </div>
      <table className="w-full text-left">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.field}
              className={`border-b ${hairline} last:border-b-0 hover:bg-background`}
            >
              <td className="w-2/5 px-4 py-2.5 align-top font-mono text-[11.5px] font-semibold text-ink">
                {row.field}
              </td>
              <td className="px-4 py-2.5 align-top text-[12.5px] leading-relaxed text-ink-2">
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
    <div className={`border-2 ${hairline} bg-card p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <Pill label={step} />
            {i < steps.length - 1 ? (
              <ArrowRight className="h-3.5 w-3.5 text-ink-3" />
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
    <div className={`border ${hairline} bg-card`}>
      {items.map((item, i) => (
        <div
          key={item.title}
          className={`flex items-start gap-4 border-b ${hairline} p-4 last:border-b-0 hover:bg-background`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-card font-mono text-[11px] font-bold text-ink">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-[13.5px] font-semibold text-ink">
              {item.title}
            </h3>
            {item.body ? (
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
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
    <div className={`overflow-hidden border-2 ${hairline} bg-card`}>
      <div
        className={`flex items-center justify-between border-b ${hairline} bg-tint px-3 py-1.5`}
      >
        <div className="flex gap-1.5">
          <span className={`h-2.5 w-2.5 border ${hairline} bg-card`} />
          <span className={`h-2.5 w-2.5 border ${hairline} bg-card`} />
          <span className={`h-2.5 w-2.5 border ${hairline} bg-ink`} />
        </div>
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink-3">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto bg-background p-4 font-mono text-[12px] leading-relaxed text-ink">
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
    <div className={`border ${hairline} bg-card p-4`}>
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 border ${hairline} bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-card`}
        >
          You
        </span>
        <p className="text-[13px] font-medium text-ink">{prompt}</p>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <span
          className={`shrink-0 border ${hairline} bg-card px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-ink`}
        >
          AI
        </span>
        <p className="text-[12.5px] leading-relaxed text-ink-2">
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
          className={`border-l-2 ${hairline} bg-card px-3 py-1.5 font-mono text-[12px] text-ink-2`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

const methodTones: Record<string, string> = {
  GET: "bg-card text-ink",
  POST: "bg-ink text-card",
  PATCH: "bg-tint text-ink",
  DELETE: "bg-warn-soft text-ink",
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
    <div className={`border ${hairline} bg-card p-4 hover:bg-background`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`border ${hairline} px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest ${
            methodTones[method] ?? "bg-card text-ink"
          }`}
        >
          {method}
        </span>
        <span className="font-mono text-[13px] font-semibold text-ink">
          {path}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
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
    <div className={`mt-12 border-2 ${hairline} bg-background p-6`}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-3">
        Continue
      </span>
      <h2 className={`mt-2 text-2xl font-semibold text-ink ${serif}`}>
        {title}
      </h2>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-2">
        {body}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) =>
          link.primary ? (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-card hover:bg-card hover:text-ink"
            >
              {link.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 border border-ink bg-card px-4 py-2 text-[13px] font-semibold text-ink hover:bg-ink hover:text-card"
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
          className={`group flex items-center gap-3 border ${hairline} bg-card p-4 hover:bg-ink hover:text-card`}
        >
          <ArrowRight className="h-4 w-4 rotate-180 text-ink group-hover:text-card" />
          <span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-ink-3 group-hover:text-tint-2">
              Previous
            </span>
            <span className="text-[13px] font-semibold text-ink group-hover:text-card">
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
          className={`group flex items-center justify-end gap-3 border ${hairline} bg-card p-4 text-right hover:bg-ink hover:text-card`}
        >
          <span>
            <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-ink-3 group-hover:text-tint-2">
              Next
            </span>
            <span className="text-[13px] font-semibold text-ink group-hover:text-card">
              {next.label}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-ink group-hover:text-card" />
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
