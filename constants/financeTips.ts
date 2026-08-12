// Curated pool for the morning/evening reminder notifications (see
// lib/financeReminders.ts). Static and local — no API call, no latency, no
// risk of off-topic output right at notification-send time.
export const FINANCE_TIPS: string[] = [
  "Track every expense for a week — most people underestimate their spending by 20% or more.",
  "Pay yourself first: move savings out the moment you're paid, before it can be spent.",
  "The 50/30/20 rule: 50% needs, 30% wants, 20% savings and debt payoff.",
  "Small recurring subscriptions add up — review yours every few months.",
  "An emergency fund of 3–6 months' expenses turns a crisis into an inconvenience.",
  "High-interest debt costs more than most investments earn — pay it down first.",
  "Automate your savings so building wealth doesn't depend on willpower.",
  "A budget isn't a restriction — it's permission to spend on what actually matters to you.",
  "Compare your spending to last month, not to someone else's lifestyle.",
  "Round up your purchases and save the difference — small amounts compound.",
  "Before a big purchase, wait 24 hours. Impulse fades faster than you'd think.",
  "Know your net worth, not just your bank balance — it's the number that actually grows.",
  "Every debt payoff is a guaranteed return equal to that debt's interest rate.",
  "Financial freedom is a savings rate, not a salary — spend less than you earn, always.",
  "Review your subscriptions today — cancel one you forgot you had.",
  "Set a specific savings goal with a deadline; vague goals rarely get funded.",
  "Cash feels different from cards — paying in cash for discretionary spending curbs overspending.",
  "Your future self is a stakeholder in every purchase you make today.",
  "Negotiate your bills once a year — many providers offer better rates if you just ask.",
  "A rising income without rising savings is just a bigger lifestyle, not more freedom.",
  "Diversify — don't let one expense category quietly dominate your budget.",
  "Debt-free doesn't mean wealthy. Keep building assets even after the debt is gone.",
  "Check in on your budget weekly — monthly reviews catch problems too late.",
  "Every 'yes' to a want is a 'no' to a future goal — spend on purpose.",
  "Windfalls (bonuses, refunds) are easiest to save before they hit your everyday spending account.",
  "Interest compounds both ways — it builds your savings and it grows your debt.",
  "A category with no budget limit is a category with no limit, period.",
  "Financial freedom starts with knowing exactly where your money goes.",
];

export function randomFinanceTip(): string {
  return FINANCE_TIPS[Math.floor(Math.random() * FINANCE_TIPS.length)];
}
