// Data sanitation

const NOT_AVAILABLE = "N/A";

export function safeNumber(
  value: unknown,
  fallback: number = 0,
): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return value.trim() !== "" && Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function displayOr(
  value: string | number | null | undefined,
  fallback: string = NOT_AVAILABLE,
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : fallback;
  }
  const text = value.trim();
  return text.length > 0 ? text : fallback;
}

export function formatCount(value: unknown): string {
  return safeNumber(value).toLocaleString("en-US");
}

export function formatQuantity(
  value: unknown,
  unit?: string | null,
): string {
  const num = safeNumber(value);
  const formatted = num.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatMoney(
  value: unknown,
  currency?: string | null,
): string {
  const num = safeNumber(value);
  const amount = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${amount}` : amount;
}

export function formatPercent(value: unknown): string {
  return `${safeNumber(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`;
}

export function normalizeCode(value: string | null | undefined): string {
  return displayOr(value)
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function normalizeName(value: string | null | undefined): string {
  const text = displayOr(value);
  if (text === NOT_AVAILABLE) return text;
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface Allocation<T> {
  entry: T;
  share: number;
}

export function allocatePercentages<T>(
  entries: T[],
  weightOf: (entry: T) => number,
): Allocation<T>[] {
  const weights = entries.map((entry) => Math.max(0, safeNumber(weightOf(entry))));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0 || entries.length === 0) {
    return entries.map((entry) => ({ entry, share: 0 }));
  }

  const raw = weights.map((weight) => (weight / total) * 100);
  const floors = raw.map((value) => Math.floor(value));
  let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  const shares = [...floors];
  for (let i = 0; remainder > 0 && i < order.length; i += 1) {
    shares[order[i].index] += 1;
    remainder -= 1;
  }

  return entries.map((entry, index) => ({ entry, share: shares[index] }));
}
