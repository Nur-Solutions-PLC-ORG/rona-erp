"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card } from "@/modules/workspace/components/ui";
import { BarList, ChartCard } from "@/modules/workspace/components/charts";
import { Skeleton } from "@/components/custom/skeleton";
import {
  useAiChat,
  useAiSummary,
  useHasAnyAiDomain,
} from "../hooks";
import {
  AnimatedAnswer,
  ChatComposer,
  EmptyConversation,
  SummaryAlerts,
  SummaryMetricGroup,
  SummaryTasks,
  ThinkingDots,
  UserBubble,
  AssistantShell,
} from "./chat";
import { AiReportsPanel } from "./reports";

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export default function AssistantRoot() {
  const { summary, isLoading } = useAiSummary();
  const { messages, send, markAnimated, clear, language, setLanguage, isSending } =
    useAiChat();
  const hasAnyDomain = useHasAnyAiDomain();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  const metricPoints = useMemo(() => {
    if (!summary) return [];
    return summary.metrics
      .flatMap((group) =>
        group.metrics
          .filter((metric) => metric.numericValue != null)
          .map((metric) => ({
            group: group.label,
            label: metric.label,
            value: metric.numericValue as number,
          })),
      )
      .filter((point) => Number.isFinite(point.value));
  }, [summary]);

  const topMetrics = metricPoints.slice(0, 8);

  const keyStats = useMemo(() => {
    if (!summary) return [];
    const alerts = summary.alerts.length;
    const overdue = summary.pendingTasks.filter((task) => task.isOverdue).length;
    const tasks = summary.pendingTasks.length;
    return [
      {
        label: "Active alerts",
        value: String(alerts),
        tone: alerts > 0 ? ("amber" as const) : ("emerald" as const),
        hint: "Issues detected across your modules",
      },
      {
        label: "Overdue tasks",
        value: String(overdue),
        tone: overdue > 0 ? ("rose" as const) : ("emerald" as const),
        hint: "Past their due date",
      },
      {
        label: "Pending tasks",
        value: String(tasks),
        tone: "zinc" as const,
        hint: "Scheduled for this period",
      },
      {
        label: "Metric groups",
        value: String(summary.metrics.length),
        tone: "zinc" as const,
        hint: "Domains included in the summary",
      },
    ];
  }, [summary]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:h-[calc(100vh-8.5rem)] lg:flex-row">
      <section
        aria-label="AI assistant workspace"
        className="flex h-[72vh] min-h-0 flex-1 flex-col lg:h-auto lg:max-w-[46%]"
      >
        <Card className="flex min-h-0 flex-1 flex-col rounded-xl shadow-sm">
          <SectionHeader
            title="AI Assistant"
            description="Ask anything — answers cite the modules they came from."
            action={
              messages.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-medium text-slate-400 transition-colors hover:text-rose-500"
                >
                  Clear
                </button>
              ) : undefined
            }
          />

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5"
          >
            {messages.length === 0 ? (
              hasAnyDomain ? (
                <EmptyConversation />
              ) : (
                <div className="flex flex-col items-center gap-2 py-14 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No data access yet
                  </p>
                  <p className="max-w-xs text-sm text-slate-400">
                    Your roles do not grant access to any Rona AI data domain.
                    Ask an admin for module permissions.
                  </p>
                </div>
              )
            ) : (
              messages.map((message) =>
                message.role === "user" ? (
                  <UserBubble key={message.id}>{message.question}</UserBubble>
                ) : (
                  <AssistantShell key={message.id}>
                    {message.error ? (
                      <p className="text-sm text-rose-600">{message.error}</p>
                    ) : message.result ? (
                      message.animated ? (
                        <AnimatedAnswer
                          result={message.result}
                          onDone={() => markAnimated(message.id)}
                        />
                      ) : (
                        <AnimatedAnswer result={message.result} />
                      )
                    ) : (
                      <ThinkingDots />
                    )}
                  </AssistantShell>
                ),
              )
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 px-5 py-4">
            <ChatComposer
              onSend={(question) => {
                send(question);
              }}
              isSending={isSending}
              showSuggestions={messages.length === 0 && hasAnyDomain}
              language={language}
              onLanguageChange={(value) =>
                setLanguage(value as typeof language)
              }
            />
          </div>
        </Card>
      </section>

      <aside
        aria-label="Rona AI overview"
        className="min-w-0 flex-1 space-y-5 pr-1 lg:overflow-y-auto"
      >
        <section aria-label="Key metrics">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {keyStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p
                    className={`mt-1.5 text-2xl font-bold tabular-nums ${
                      stat.tone === "amber"
                        ? "text-amber-600"
                        : stat.tone === "rose"
                          ? "text-rose-600"
                          : stat.tone === "emerald"
                            ? "text-emerald-600"
                            : "text-slate-900"
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {hasAnyDomain ? <AiReportsPanel /> : null}

        {!isLoading && metricPoints.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <ChartCard
              title="Key metrics across modules"
              description="Every numeric metric the summary collected for this period."
              isEmpty={metricPoints.length === 0}
              emptyMessage="No numeric metrics yet"
            >
              <BarList
                points={topMetrics.map((point) => ({
                  label: point.label,
                  value: point.value,
                }))}
                valueFormat={(value) =>
                  value.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })
                }
              />
            </ChartCard>

            <ChartCard
              title="Metrics by domain"
              description="How the collected metrics spread across your modules."
              isEmpty={metricPoints.length === 0}
              emptyMessage="No numeric metrics yet"
            >
              <BarList
                points={Object.entries(
                  metricPoints.reduce<Record<string, number>>((acc, point) => {
                    acc[point.group] = (acc[point.group] ?? 0) + 1;
                    return acc;
                  }, {}),
                )
                  .map(([label, value]) => ({ label, value }))
                  .sort((a, b) => b.value - a.value)}
                valueFormat={(value) => String(value)}
              />
            </ChartCard>
          </div>
        ) : null}

        {summary && summary.metrics.length > 0 && (
          <section aria-label="Domain summaries">
            <Card className="rounded-xl shadow-sm">
              <SectionHeader
                title="Domain summaries"
                description={`Metrics the assistant can see for ${summary.periodLabel}.`}
              />
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                {summary.metrics.map((group) => (
                  <SummaryMetricGroup key={group.domain} group={group} />
                ))}
              </div>
            </Card>
          </section>
        )}

        {summary &&
          (summary.alerts.length > 0 || summary.pendingTasks.length > 0) && (
            <div className="grid grid-cols-1 gap-4">
              {summary.alerts.length > 0 && (
                <Card className="rounded-xl shadow-sm">
                  <SectionHeader
                    title="Alerts"
                    description={`Detected for ${summary.periodLabel}`}
                  />
                  <div className="p-5">
                    <SummaryAlerts alerts={summary.alerts} />
                  </div>
                </Card>
              )}
              {summary.pendingTasks.length > 0 && (
                <Card className="rounded-xl shadow-sm">
                  <SectionHeader
                    title="Pending tasks"
                    description="Follow-ups scheduled by the assistant"
                  />
                  <div className="p-5">
                    <SummaryTasks tasks={summary.pendingTasks} />
                  </div>
                </Card>
              )}
            </div>
          )}
      </aside>
    </div>
  );
}
