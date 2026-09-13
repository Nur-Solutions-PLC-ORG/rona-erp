import type { AiDataDomain, AiReportPeriod } from '@rona/types/ai';
import type { PeriodSpec } from './types/ai-contexts.types.js';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function ordinalLabel(date: Date): string {
  const d = date.getUTCDate();
  const m = MONTHS[date.getUTCMonth()];
  return `${String(d).padStart(2, '0')} ${m} ${date.getUTCFullYear()}`;
}

function shortLabel(date: Date): string {
  const d = date.getUTCDate();
  const m = MONTHS[date.getUTCMonth()];
  return `${String(d).padStart(2, '0')} ${m}`;
}

export function periodForDay(day: Date): PeriodSpec {
  const previous = addDays(day, -1);
  return {
    start: toIsoDate(day),
    end: toIsoDate(day),
    label: ordinalLabel(day),
    previousStart: toIsoDate(previous),
    previousEnd: toIsoDate(previous),
    previousLabel: 'yesterday',
  };
}

export function periodForWeekEnding(day: Date): PeriodSpec {
  const start = addDays(day, -6);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(start, -7);
  return {
    start: toIsoDate(start),
    end: toIsoDate(day),
    label: `${shortLabel(start)} – ${ordinalLabel(day)}`,
    previousStart: toIsoDate(prevStart),
    previousEnd: toIsoDate(prevEnd),
    previousLabel: 'previous week',
  };
}

export function periodForMonth(day: Date): PeriodSpec {
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
  const nextMonth =
    start.getUTCMonth() === 11
      ? new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1))
      : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const end = addDays(nextMonth, -1);
  const prevEnd = addDays(start, -1);
  const prevStart = new Date(
    Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), 1),
  );
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    label: `${MONTHS_FULL[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
    previousStart: toIsoDate(prevStart),
    previousEnd: toIsoDate(prevEnd),
    previousLabel: `${MONTHS_FULL[prevEnd.getUTCMonth()]} ${prevEnd.getUTCFullYear()}`,
  };
}

export function customPeriod(
  periodStart: string,
  periodEnd: string,
): PeriodSpec {
  const start = fromIsoDate(periodStart);
  const end = fromIsoDate(periodEnd);
  if (toIsoDate(end) < toIsoDate(start)) {
    throw new Error(`period end ${periodEnd} is before start ${periodStart}`);
  }
  return {
    start: periodStart,
    end: periodEnd,
    label:
      periodStart === periodEnd
        ? ordinalLabel(start)
        : `${ordinalLabel(start)} – ${ordinalLabel(end)}`,
    previousStart: null,
    previousEnd: null,
    previousLabel: null,
  };
}

export function periodHasComparison(period: PeriodSpec): boolean {
  return period.previousStart != null && period.previousEnd != null;
}

const COMPARISON_PHRASES = [
  'compared to',
  'compare',
  'versus',
  'vs',
  'against',
] as const;

export function periodFromQuestion(
  question: string,
  today: Date,
): PeriodSpec | null {
  const normalized = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const words = new Set(normalized.split(' '));
  const asksComparison = COMPARISON_PHRASES.some((phrase) =>
    normalized.includes(phrase),
  );

  if (words.has('today') && words.has('yesterday') && asksComparison) {
    return periodForDay(today);
  }
  if (words.has('yesterday')) {
    return periodForDay(addDays(today, -1));
  }
  if (words.has('today')) {
    return periodForDay(today);
  }
  if (
    normalized.includes('last week') ||
    normalized.includes('previous week')
  ) {
    return periodForWeekEnding(addDays(today, -7));
  }
  if (
    normalized.includes('this week') ||
    normalized.includes('weekly report') ||
    words.has('weekly')
  ) {
    return periodForWeekEnding(today);
  }
  return null;
}

export interface ResolvePeriodArgs {
  periodStart?: string;
  periodEnd?: string;
  defaultMonth: boolean;
  question?: string;
}

export function resolvePeriod(args: ResolvePeriodArgs): PeriodSpec {
  const { periodStart, periodEnd, defaultMonth, question } = args;

  if (periodStart != null && periodEnd != null) {
    return customPeriod(periodStart, periodEnd);
  }

  const today = new Date();
  if (question && !defaultMonth) {
    const inferred = periodFromQuestion(question, today);
    if (inferred) return inferred;
  }
  return defaultMonth ? periodForMonth(today) : periodForDay(today);
}

export function periodFromPreset(
  preset: AiReportPeriod,
  today: Date = new Date(),
): PeriodSpec {
  switch (preset) {
    case 'today':
      return periodForDay(today);
    case 'yesterday':
      return periodForDay(addDays(today, -1));
    case 'this_week':
      return periodForWeekEnding(today);
    case 'last_week': {
      const lastWeekEnd = addDays(today, -7);
      const lastWeekStart = addDays(lastWeekEnd, -6);
      return {
        start: toIsoDate(lastWeekStart),
        end: toIsoDate(lastWeekEnd),
        label: `${shortLabel(lastWeekStart)} – ${ordinalLabel(lastWeekEnd)}`,
        previousStart: toIsoDate(addDays(lastWeekStart, -7)),
        previousEnd: toIsoDate(addDays(lastWeekStart, -1)),
        previousLabel: 'week before',
      };
    }
    case 'this_month':
      return periodForMonth(today);
    case 'last_month': {
      const thisMonthStart = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      const lastMonthEnd = addDays(thisMonthStart, -1);
      return periodForMonth(lastMonthEnd);
    }
    case 'custom':
    default: {
      return periodForMonth(today);
    }
  }
}

export function periodOfDayCount(period: PeriodSpec): number {
  return diffDays(fromIsoDate(period.start), fromIsoDate(period.end)) + 1;
}

export function domainSet(domains: AiDataDomain[]): Set<AiDataDomain> {
  return new Set(domains);
}
