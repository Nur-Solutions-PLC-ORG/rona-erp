// Gregorian → Ethiopian (Ethiopic) calendar conversion for date labels.
//
// The Ethiopian calendar has 13 months: 12 x 30 days plus Pagume (5 days,
// 6 in a leap year). Enkutatash (Meskerem 1) falls on September 11 of the
// Gregorian year, or September 12 when the previous Ethiopian year is a
// leap year (the 6th Pagume day). Ethiopian leap years satisfy
// (year + 1) % 4 === 0, and the Ethiopian year number is 7/8 behind the
// Gregorian year for dates after Enkutatash / before it respectively.

export interface EthiopianDate {
  year: number;
  month: number; // 1..13, where 13 is Pagume
  day: number;
}

const AMHARIC_MONTHS = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ',
] as const;

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function enkutatashJdn(ethiopianYear: number): number {
  const gregorianYear = ethiopianYear + 7;
  const day = ethiopianYear % 4 === 0 ? 12 : 11;
  return gregorianToJdn(gregorianYear, 9, day);
}

export function ethiopianDate(gregorian: Date): EthiopianDate {
  const jdn = gregorianToJdn(
    gregorian.getUTCFullYear(),
    gregorian.getUTCMonth() + 1,
    gregorian.getUTCDate(),
  );
  let year = gregorian.getUTCFullYear() - 7;
  if (jdn < enkutatashJdn(year)) year -= 1;
  const dayOfYear = jdn - enkutatashJdn(year) + 1;
  const month = Math.floor((dayOfYear - 1) / 30) + 1;
  const day = ((dayOfYear - 1) % 30) + 1;
  return { year, month, day };
}

export function ethiopianDayLabel(date: Date): string {
  const e = ethiopianDate(date);
  return `${e.day} ${AMHARIC_MONTHS[e.month - 1]} ${e.year} ዓ.ም.`;
}

export function ethiopianShortDayLabel(date: Date): string {
  const e = ethiopianDate(date);
  return `${e.day} ${AMHARIC_MONTHS[e.month - 1]}`;
}

export function ethiopianMonthYearLabel(date: Date): string {
  const e = ethiopianDate(date);
  if (e.month === 13) {
    return `ጳጉሜ ${e.year} ዓ.ም.`;
  }
  return `${AMHARIC_MONTHS[e.month - 1]} ${e.year} ዓ.ም.`;
}
