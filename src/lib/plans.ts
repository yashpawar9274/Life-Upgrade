export type PlanCode = "monthly" | "yearly" | "lifetime";

export type PlanOption = {
  code: PlanCode;
  title: string;
  price: number;
  priceLabel: string;
  cadence: string;
  note: string;
  badge?: string;
  recurring: boolean;
};

export const PLAN_OPTIONS: PlanOption[] = [
  {
    code: "monthly",
    title: "Monthly",
    price: 399,
    priceLabel: "₹399",
    cadence: "per month",
    note: "Auto-renews every month. Cancel anytime.",
    recurring: true,
  },
  {
    code: "yearly",
    title: "Yearly",
    price: 3499,
    priceLabel: "₹3,499",
    cadence: "per year",
    note: "Auto-renews yearly. Saves ₹1,289 vs monthly.",
    badge: "Best value",
    recurring: true,
  },
  {
    code: "lifetime",
    title: "Lifetime",
    price: 7999,
    priceLabel: "₹7,999",
    cadence: "one time",
    note: "Pay once, Premium stays unlocked forever.",
    recurring: false,
  },
];

export function planByCode(code: PlanCode): PlanOption {
  return PLAN_OPTIONS.find((p) => p.code === code) ?? PLAN_OPTIONS[0]!;
}
