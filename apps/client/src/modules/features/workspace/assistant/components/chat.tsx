"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/modules/workspace/components/ui";
import { useTypewriter } from "../hooks";
import type {
  AiAlertOut,
  AiChatResult,
  AiMetricGroup,
  AiPendingTaskOut,
} from "@rona/types/ai";
import {
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
  HiOutlinePaperAirplane,
  HiOutlineXCircle,
} from "react-icons/hi2";

export function TypewriterText({
  text,
  charsPerTick = 3,
  onDone,
  className,
}: {
  text: string;
  charsPerTick?: number;
  onDone?: () => void;
  className?: string;
}) {
  const { text: shown, done } = useTypewriter(text, charsPerTick);

  useEffect(() => {
    if (done) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {shown}
      {!done && <span className="ai-caret" aria-hidden />}
    </p>
  );
}

export function Stagger({
  count,
  delayMs = 70,
  render,
}: {
  count: number;
  delayMs?: number;
  render: (index: number) => ReactNode;
}) {
  const [step, setStep] = useState(0);
  const runId = useRef(0);

  useEffect(() => {
    const id = ++runId.current;
    if (!count) return;
    const timers = Array.from({ length: count }, (_, i) =>
      setTimeout(() => {
        if (runId.current === id) setStep(i + 1);
      }, delayMs * (i + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [count, delayMs]);

  const visible = Math.min(step, count);

  return (
    <>
      {Array.from({ length: count }, (_, i) =>
        i < visible ? (
          <div key={i} className="ai-fade-up">
            {render(i)}
          </div>
        ) : null,
      )}
    </>
  );
}

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="ai-fade-up max-w-[85%] rounded-2xl rounded-br-sm bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function AssistantShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%]">
        <div className="mb-1.5 text-xs font-semibold text-zinc-500">Rona AI</div>
        <div className="ai-fade-up rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="ai-dot h-2 w-2 rounded-full bg-zinc-400"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  );
}

export function AnimatedAnswer({
  result,
  onDone,
}: {
  result: AiChatResult;
  onDone?: () => void;
}) {
  const [answerDone, setAnswerDone] = useState(false);

  return (
    <div className="space-y-3">
      <TypewriterText
        text={result.answer}
        onDone={() => {
          setAnswerDone(true);
          onDone?.();
        }}
        className="text-sm leading-relaxed text-zinc-800"
      />

      {answerDone && result.supportingData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Stagger count={result.supportingData.length} render={(i) => {
            const metric = result.supportingData[i];
            return (
              <div className="inline-flex max-w-full items-baseline gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                <span className="text-xs font-medium text-zinc-500">
                  {metric.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-zinc-900">
                  {metric.value}
                  {metric.unit ? ` ${metric.unit}` : ""}
                </span>
                {metric.comparison ? (
                  <span className="text-xs font-medium text-emerald-600">
                    {metric.comparison}
                  </span>
                ) : null}
              </div>
            );
          }} />
        </div>
      )}

      {answerDone && result.recommendation && (
        <div className="ai-fade-up flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <HiOutlineLightBulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Recommendation
            </p>
            <p className="text-sm leading-relaxed text-amber-900">
              {result.recommendation}
            </p>
          </div>
        </div>
      )}

      {answerDone && result.source.length > 0 && (
        <div className="ai-fade-up rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-2">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <HiOutlineChatBubbleLeftEllipsis className="h-3.5 w-3.5" />
            Data sources
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {result.source.map((label) => (
              <span
                key={label}
                className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200"
              >
                {label}
              </span>
            ))}
            {result.periodLabel ? (
              <span className="text-xs text-zinc-400">
                · Period: {result.periodLabel}
              </span>
            ) : null}
            {result.partialData ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                Partial data
              </span>
            ) : null}
          </div>
        </div>
      )}

      {answerDone && result.source.length === 0 && result.dataAvailable && (
        <p className="text-xs italic text-zinc-400">
          This answer was generated from general context, not a specific data
          module.
        </p>
      )}

      {answerDone && !result.dataAvailable && (
        <p className="text-xs italic text-zinc-400">
          No data was available for this question in your accessible modules.
        </p>
      )}
    </div>
  );
}

export function SummaryMetricGroup({ group }: { group: AiMetricGroup }) {
  return (
    <div className="h-full rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {group.label}
      </p>
      <dl className="space-y-3">
        {group.metrics.map((metric) => (
          <div key={metric.key} className="flex items-baseline justify-between gap-3">
            <dt className="truncate text-sm text-zinc-500">{metric.label}</dt>
            <dd className="shrink-0 text-base font-semibold tabular-nums text-zinc-900">
              {metric.value}
              {metric.unit ? (
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  {metric.unit}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const ALERT_ACCENT: Record<
  AiAlertOut["severity"],
  { bar: string; icon: string; label: string }
> = {
  info: {
    bar: "border-l-sky-500",
    icon: "text-sky-500",
    label: "text-sky-700",
  },
  warning: {
    bar: "border-l-amber-500",
    icon: "text-amber-500",
    label: "text-amber-700",
  },
  critical: {
    bar: "border-l-rose-500",
    icon: "text-rose-500",
    label: "text-rose-700",
  },
};

function AlertIcon({ severity }: { severity: AiAlertOut["severity"] }) {
  const className = "h-5 w-5 shrink-0";
  if (severity === "critical") {
    return <HiOutlineXCircle className={cn(className, ALERT_ACCENT.critical.icon)} />;
  }
  if (severity === "info") {
    return (
      <HiOutlineExclamationCircle className={cn(className, ALERT_ACCENT.info.icon)} />
    );
  }
  return (
    <HiOutlineExclamationTriangle
      className={cn(className, ALERT_ACCENT.warning.icon)}
    />
  );
}

export function SummaryAlerts({ alerts }: { alerts: AiAlertOut[] }) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-3">
      <Stagger count={alerts.length} render={(i) => {
        const alert = alerts[i];
        const accent = ALERT_ACCENT[alert.severity];
        return (
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border border-zinc-200/80 border-l-4 bg-white px-4 py-3 shadow-sm",
              accent.bar,
            )}
          >
            <AlertIcon severity={alert.severity} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", accent.label)}>
                {alert.title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">
                {alert.message}
              </p>
            </div>
          </div>
        );
      }} />
    </div>
  );
}

export function SummaryTasks({ tasks }: { tasks: AiPendingTaskOut[] }) {
  if (!tasks.length) return null;
  return (
    <ul className="divide-y divide-zinc-100">
      {tasks.map((task) => (
        <li
          key={task.taskId}
          className="ai-fade-up flex items-center gap-3 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-700">
              {task.title}
            </p>
            {task.dueDate ? (
              <p className="text-xs text-zinc-400">Due {task.dueDate}</p>
            ) : null}
          </div>
          {task.isOverdue && (
            <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
              Overdue
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const PROMPT_SUGGESTIONS = [
  "What needs my attention today?",
  "How was production this week?",
  "Show me low stock items",
  "Any overdue invoices?",
];

export const AI_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "አማርኛ (Amharic)", value: "am" },
  { label: "Afaan Oromoo (Oromo)", value: "om" },
] as const;

const COMPOSER_INPUT =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white pl-11 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/30 disabled:opacity-50";

export function ChatComposer({
  onSend,
  isSending,
  showSuggestions,
  language,
  onLanguageChange,
}: {
  onSend: (question: string) => void;
  isSending: boolean;
  showSuggestions: boolean;
  language: string;
  onLanguageChange: (language: string) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const languageIndex = Math.max(
    0,
    AI_LANGUAGES.findIndex((option) => option.value === language),
  );
  const activeLanguage = AI_LANGUAGES[languageIndex];

  const cycleLanguage = () => {
    const next =
      AI_LANGUAGES[(languageIndex + 1) % AI_LANGUAGES.length];
    onLanguageChange(next.value);
  };

  const submit = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {showSuggestions && (
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-xs font-medium text-zinc-500 sm:w-auto sm:leading-8">
            Try asking:
          </span>
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              disabled={isSending}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:border-zinc-300 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <HiOutlineChatBubbleLeftEllipsis className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about attendance, production, stock, quality, finance…"
            maxLength={1000}
            disabled={isSending}
            className={COMPOSER_INPUT}
          />
        </div>

        <button
          type="button"
          onClick={cycleLanguage}
          disabled={isSending}
          title={`Answer language: ${activeLanguage.label}`}
          aria-label={`Answer language: ${activeLanguage.label}`}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500/30 disabled:opacity-50"
        >
          <HiOutlineGlobeAlt className="h-5 w-5 text-zinc-500" />
          <span className="hidden sm:inline">
            {activeLanguage.value.toUpperCase()}
          </span>
        </button>

        <button
          type="submit"
          disabled={isSending || !value.trim()}
          title="Send"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSending ? (
            <span className="flex gap-1" aria-label="Thinking">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="ai-dot h-1.5 w-1.5 rounded-full bg-white"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </span>
          ) : (
            <HiOutlinePaperAirplane className="h-5 w-5 -rotate-45" />
          )}
        </button>
      </form>
    </div>
  );
}

export function EmptyConversation() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
        <HiOutlineChatBubbleLeftEllipsis className="h-6 w-6 text-zinc-400" />
      </span>
      <p className="text-sm font-medium text-zinc-600">
        Start a conversation
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
        Ask about attendance, production efficiency, stock levels, invoices or
        sales — or tap a suggestion below.
      </p>
    </div>
  );
}

export { Card };
