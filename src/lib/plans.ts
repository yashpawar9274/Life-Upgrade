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
<<<<<<< HEAD
    title: "Monthly",
    price: 399,
    priceLabel: "₹399",
    cadence: "per month",
    note: "Auto-renews every month. Cancel anytime.",
=======
    title: "Personal Coach",
    price: 199,
    priceLabel: "₹199",
    cadence: "per month",
    note: "Personal AI Coach, weekly reviews and fair-use AI credits. Cancel anytime.",
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
    recurring: true,
  },
  {
    code: "yearly",
<<<<<<< HEAD
    title: "Yearly",
    price: 3499,
    priceLabel: "₹3,499",
    cadence: "per year",
    note: "Auto-renews yearly. Saves ₹1,289 vs monthly.",
=======
    title: "Personal Coach Yearly",
    price: 1499,
    priceLabel: "₹1,499",
    cadence: "per year",
    note: "Everything in Personal Coach. Saves over 35% vs monthly.",
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
    badge: "Best value",
    recurring: true,
  },
  {
    code: "lifetime",
<<<<<<< HEAD
    title: "Lifetime",
    price: 7999,
    priceLabel: "₹7,999",
    cadence: "one time",
    note: "Pay once, Premium stays unlocked forever.",
=======
    title: "Starter Lifetime",
    price: 299,
    priceLabel: "₹299",
    cadence: "one time",
    note: "Lifetime tracking, insights and challenges. Includes 15 one-time AI credits; unlimited AI is not included.",
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
    recurring: false,
  },
];

export function planByCode(code: PlanCode): PlanOption {
  return PLAN_OPTIONS.find((p) => p.code === code) ?? PLAN_OPTIONS[0]!;
}
