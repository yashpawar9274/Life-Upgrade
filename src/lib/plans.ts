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
    title: "Personal Coach",
    price: 199,
    priceLabel: "₹199",
    cadence: "per month",
    note: "Personal AI Coach, weekly reviews and fair-use AI credits. Cancel anytime.",
    recurring: true,
  },
  {
    code: "yearly",
    title: "Personal Coach Yearly",
    price: 1499,
    priceLabel: "₹1,499",
    cadence: "per year",
    note: "Everything in Personal Coach. Saves over 35% vs monthly.",
    badge: "Best value",
    recurring: true,
  },
  {
    code: "lifetime",
    title: "Starter Lifetime",
    price: 299,
    priceLabel: "₹299",
    cadence: "one time",
    note: "Lifetime tracking, insights and challenges. Includes 15 one-time AI credits; unlimited AI is not included.",
    recurring: false,
  },
];

export function planByCode(code: PlanCode): PlanOption {
  return PLAN_OPTIONS.find((p) => p.code === code) ?? PLAN_OPTIONS[0]!;
}
