import { TxType } from "@/types";
import { toISODate } from "@/utils/dates";

export interface ParsedNotificationTransaction {
  amount: number;
  merchant: string | null;
  txType: TxType;
  /** "YYYY-MM-DD" — only set when the notification text itself states a date (see extractDateFromText) */
  date: string | null;
}

interface BankTemplate {
  /** Human-readable label, shown in Settings' allowlist and for debugging */
  bank: string;
  /** Android package name this template applies to */
  packageName: string;
  /** Matched against title + " " + text + " " + bigText, case-insensitive */
  pattern: RegExp;
  /**
   * Which capture group(s) in `pattern` can hold the amount (1-indexed,
   * matching RegExpMatchArray) — an array because a pattern with multiple
   * alternation branches (e.g. "debited Rs X" vs "Rs X was debited") puts
   * the amount in a different group depending on which branch matched; the
   * other branch's group is `undefined` in that case. Tried in order, first
   * one that yields a valid amount wins.
   */
  amountGroups: number[];
  txType: TxType;
  /** Extracts the merchant from the regex match, if the pattern captures one */
  getMerchant?: (match: RegExpMatchArray) => string | null;
}

// Card-network merchant strings are raw POS terminal data, not clean names —
// trailing 2-letter country codes ("LK"), city+country run together ("COLK"
// = "COL" + "LK"), embedded phone numbers, and the city name often repeated
// twice (once as the town, once as the settlement region). Cleaned up
// on-device so the review screen doesn't show "KEELLS PANNIPITIYA
// PANNIPITIYA COLK" — still just a best-effort default; the user can always
// edit the merchant field before saving (2026-08-10 decision: regex cleanup,
// not a Gemini round-trip just for merchant text).
function cleanMerchant(raw: string): string {
  let cleaned = raw.trim();

  // Embedded phone numbers, e.g. "PICKME RIDE 0117433433 LK"
  cleaned = cleaned.replace(/\b0\d{8,10}\b/g, " ");

  // Trailing "<city letters><LK>" run-together country code, e.g. "COLK" → "COL"
  cleaned = cleaned.replace(/\b([A-Z]{2,})LK\b/i, "$1");

  // Trailing standalone 2-letter country code, e.g. "UBER EATS 852 LK"
  cleaned = cleaned.replace(/\s+[A-Z]{2}$/i, "");

  // Trailing merchant/reference numeric code, e.g. "UBER EATS 852"
  cleaned = cleaned.replace(/\s+\d{2,6}$/, "");

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Collapse an immediately-repeated word, e.g. "PANNIPITIYA PANNIPITIYA" → "PANNIPITIYA"
  cleaned = cleaned.replace(/\b(\w+)( \1\b)+/gi, "$1");

  if (!cleaned) return raw.trim();

  return cleaned
    .toLowerCase()
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// Best-effort merchant pull for templates that match on a debit/credit
// keyword rather than an explicit "at <merchant>" shape (e.g. "Rs 850 spent
// at Keells Super") — looks at the *whole* notification text via `at|to`,
// not just the template's own capture groups, so a generic debit/credit
// match doesn't lose the merchant name that a more specific template
// further down TEMPLATES would otherwise have extracted.
function extractTrailingMerchant(fullText: string): string | null {
  const match = fullText.match(/\b(?:at|to)\s+([a-z0-9 &'.\-]{2,40})$/i);
  return match ? cleanMerchant(match[1]) : null;
}

// Extracts a "DD/MM/YY" or "DD/MM/YYYY" date from notification text (Sri
// Lankan bank SMS alerts commonly print the transaction date, which can
// predate when Android actually delivered/relayed the notification) —
// falls back to the notification's postTime when the text has no date.
function extractDateFromText(text: string): string | null {
  const match = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Constructed via the local-time Date constructor (not an ISO string,
  // which parses as UTC and can shift a day in negative-UTC-offset
  // timezones) so toISODate — which reads back via local getters — round-trips
  // exactly the day/month/year this function parsed, then reuses the app's
  // one YYYY-MM-DD formatter instead of a second hand-rolled copy of it.
  const parsed = new Date(year, month - 1, day);

  // A day past the end of its month (e.g. "30/02/26") doesn't throw — the
  // Date constructor silently rolls it into the next month instead (Feb 30 →
  // Mar 2). Comparing back against what was actually requested catches that
  // rather than returning a date that's quietly wrong.
  if (parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;

  return toISODate(parsed);
}

// Starter set. Real bank notification text varies a lot between banks and
// even between a bank's own SMS-relay vs. app-push formats, so this list
// grows as real samples come in (PLAN.md §7 "step zero") — the "Purchase at
// X for LKR Y ... authorised on your debit card" template below is the
// verified real ComBank/card-network SMS-relay format as of 2026-08-10.
// Anything that doesn't match falls through to the Gemini fallback (see
// lib/notificationCapture.ts), so an incomplete template list degrades
// gracefully rather than silently dropping a transaction.
const TEMPLATES: BankTemplate[] = [
  {
    // "Dear Cardholder, Purchase at KEELLS PANNIPITIYA PANNIPITIYA COLK for
    // LKR 953.00 on 07/08/26 04:28 PM has been authorised on your debit card
    // ending #7806." — the standard Sri Lankan card-network authorisation
    // SMS format, seen across multiple merchants (Keells, PickMe, Uber Eats).
    bank: "Card authorisation (Purchase at X for LKR Y)",
    packageName: "*",
    pattern: /purchase at\s+(.+?)\s+for\s+(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?).{0,40}?(?:authoris|authoriz)/i,
    amountGroups: [2],
    txType: TxType.Expense,
    getMerchant: (m) => cleanMerchant(m[1]),
  },
  {
    // "Withdrawal at MAHARAGA-CRM3 BR MAHARAGAMA COLK for LKR 6,000.00 on
    // 15/08/26 09:17 AM from card ending #7806. Click link to view the
    // Digital Receipt..." — ComBank's ATM withdrawal SMS format. Distinct
    // from the "Purchase at X" template above: no "authorised" keyword, and
    // uses "from card" rather than "on your debit card" (caught via a real
    // notification sample that fell through to Gemini and was lost when that
    // fallback call failed, 2026-08-16).
    bank: "Card authorisation (Withdrawal at X for LKR Y)",
    packageName: "*",
    pattern: /withdrawal at\s+(.+?)\s+for\s+(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?)/i,
    amountGroups: [2],
    txType: TxType.Expense,
    getMerchant: (m) => cleanMerchant(m[1]),
  },
  {
    bank: "Generic debit alert",
    packageName: "*",
    // Matches either word order — "debited Rs 500" or "Rs 500 was debited" —
    // so a debit phrased amount-first isn't missed and left to fall through
    // to a less specific template. Each alternation branch captures the
    // amount into its own group (1 or 2); only one is populated per match.
    // This template's match comes before the more specific "at <merchant>"
    // template below in TEMPLATES order (e.g. "Rs 850 spent at Keells Super"
    // matches "spent" here first), so without its own getMerchant a matching
    // debit alert would silently lose a merchant name a later template could
    // have extracted — extractTrailingMerchant recovers it from the tail of
    // the full text rather than this pattern's own capture groups.
    pattern: /(?:(?:debited|spent|purchase of|paid)\D{0,20}(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?))|(?:(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?)\D{0,20}(?:debited|spent|paid))/i,
    amountGroups: [1, 2],
    txType: TxType.Expense,
    getMerchant: (m) => extractTrailingMerchant(m.input ?? ""),
  },
  {
    bank: "Generic credit alert",
    packageName: "*",
    // Same both-orders reasoning as the debit template above — real bank
    // wording isn't consistently "credited Rs X"; "Rs X credited to your
    // account" is just as common and was previously falling through to the
    // "at <merchant>" debit template below, misclassifying income as an
    // expense (caught via a real notification sample, 2026-08-11).
    // "credit for"/"credit of" also covers ComBank's incoming-transfer
    // wording ("Credit for Rs. 300,755.00 to <acct> at ... DIGITAL BANKING
    // DIVISION") — the noun "Credit", not the past-tense "credited", which
    // this template previously missed entirely, letting the debit template
    // below misclassify a salary/transfer credit as an expense (caught via a
    // real notification sample, 2026-08-12).
    pattern: /(?:(?:credited|received|deposit of|credit (?:for|of))\D{0,20}(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?))|(?:(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?)\D{0,20}(?:credited|received))/i,
    amountGroups: [1, 2],
    txType: TxType.Income,
    // No getMerchant here, deliberately: a credit's trailing "to X" is
    // typically your own account ("credited to your Savings account", "to
    // 8021406412 at DIGITAL BANKING DIVISION"), not a counterparty — unlike
    // a debit's "at/to X", which is the merchant. Applying the same
    // trailing-merchant heuristic here would prefill nonsense like merchant
    // "8021406412" or "Your Savings Account" for income.
  },
  {
    bank: "Generic 'at <merchant>' debit",
    packageName: "*",
    // Excludes text containing a credit-indicating word — this template only
    // recognizes "Rs X at/to Y" shapes, which a genuine credit notification
    // ("Rs 5,000 credited to your Savings account", "Credit for Rs X to
    // <acct> at <branch>") can also incidentally match ("to your Savings
    // account" / "to <acct> at <branch>" both look like "to <merchant>").
    // Without this guard, any credit phrasing the credit template above
    // doesn't anticipate gets silently misclassified as an expense instead
    // of falling through to the Gemini fallback.
    pattern: /^(?!.*(?:credited|received|deposit|credit (?:for|of))).*(?:rs\.?|lkr)\s?([\d,]+(?:\.\d{1,2})?)\D{0,10}(?:at|to)\s+([a-z0-9 &'.\-]{2,40})/i,
    amountGroups: [1],
    txType: TxType.Expense,
    getMerchant: (m) => (m[2] ? cleanMerchant(m[2]) : null),
  },
];

// Notifications that mention an amount but are not a completed transaction —
// OTP/approval-code requests above all. Checked before the templates above
// so a message like "Digital-Transfer within ComBank LKR 20,000.00
// attempted. Please use code 719321 to approve. Do NOT share this number
// with anyone" — a request for the user to act, not money that has already
// moved — never gets treated as a real transaction, even by a future,
// looser template that might otherwise match "LKR 20,000.00". Deliberately
// narrow: only OTP-specific phrasing ("use code", "do not share", "one-time
// password") is excluded here, not general words like "attempted" or
// "declined" that a bank could plausibly also use inside a genuinely
// completed transaction's wording (e.g. "your payment attempt was
// successful") — a false-negative there just means an extra Gemini call,
// while a false-positive here means a real transaction silently vanishes
// before the user ever sees it in the review inbox, which is worse.
const NON_TRANSACTION_RE = /\b(otp|one.?time.?password|verification code|use code \d|do not share)\b/i;

// raw is undefined when called for a capture group from an alternation
// branch that didn't match (see BankTemplate.amountGroups) — a plain regex
// match array has `undefined` at any unmatched group's index, not "".
function extractAmount(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const cleaned = raw.replace(/,/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * On-device, regex-only parse — free, private, no network (PLAN.md §7).
 * Returns null when nothing matches (or the text looks like an OTP/attempt
 * rather than a completed transaction); the caller should fall back to the
 * Gemini structured-output path rather than treat this as a final answer.
 */
export function parseNotificationText(
  packageName: string,
  fullText: string
): ParsedNotificationTransaction | null {
  const haystack = fullText.trim();
  if (!haystack) return null;
  if (NON_TRANSACTION_RE.test(haystack)) return null;

  for (const template of TEMPLATES) {
    if (template.packageName !== "*" && template.packageName !== packageName) continue;
    const match = haystack.match(template.pattern);
    if (!match) continue;

    const amount = template.amountGroups
      .map((group) => extractAmount(match[group]))
      .find((value): value is number => value !== null) ?? null;
    if (amount === null) continue;

    return {
      amount,
      merchant: template.getMerchant?.(match) ?? null,
      txType: template.txType,
      date: extractDateFromText(haystack),
    };
  }

  return null;
}

// A single card payment often fires both an app push notification and an
// SMS-relay notification with slightly different text but the same amount
// within a few seconds of each other (PLAN.md §7) — this is the tolerance
// window for treating two captures as the same underlying transaction.
const DEDUP_WINDOW_MS = 90_000;

/**
 * True when two captured notifications likely represent the same underlying
 * payment — same amount, posted within DEDUP_WINDOW_MS of each other. Pass
 * every already-seen (amount, postTime) pair in `existing`; a fixed-bucket
 * key (e.g. rounding the timestamp) would wrongly split pairs that straddle
 * a bucket boundary, so this compares directly against the actual window.
 */
export function isDuplicateNotification(
  amount: number,
  postTimeMs: number,
  existing: { amount: number; postTimeMs: number }[]
): boolean {
  return existing.some(
    (e) => e.amount === amount && Math.abs(e.postTimeMs - postTimeMs) <= DEDUP_WINDOW_MS
  );
}
