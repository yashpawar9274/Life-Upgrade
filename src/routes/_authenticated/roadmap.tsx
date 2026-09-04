import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Banknote,
  Brain,
  Check,
  Crown,
  Dumbbell,
  Lock,
  Shirt,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { t } from "@/lib/i18n";
import { DISCLAIMER, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "Luxury Life Roadmap — LIFE UPGRADE Premium" },
      {
        name: "description",
        content:
          "Eight pillars — health, appearance, confidence, skills, work, savings, discipline and social circle — with small steps you can tick off every week.",
      },
      { property: "og:title", content: "Luxury Life Roadmap — LIFE UPGRADE" },
      {
        property: "og:description",
        content: "A calm, staged plan for a healthier, sharper, wealthier version of you.",
      },
    ],
  }),
  component: RoadmapPage,
});

type Pillar = {
  key: string;
  icon: typeof Activity;
  title: string;
  titleHi: string;
  steps: { en: string; hi: string }[];
};

const PILLARS: Pillar[] = [
  {
    key: "health",
    icon: Activity,
    title: "Health",
    titleHi: "स्वास्थ्य",
    steps: [
      { en: "3L water + 7.5h sleep for 14 days", hi: "14 दिन तक 3 लीटर पानी और 7.5 घंटे नींद" },
      { en: "Walk 6,000+ steps daily", hi: "रोज़ 6,000+ कदम चलें" },
      { en: "Home-cooked food 6 days a week", hi: "हफ़्ते में 6 दिन घर का खाना" },
      { en: "Basic health check-up done", hi: "बुनियादी हेल्थ चेक-अप कराएँ" },
    ],
  },
  {
    key: "appearance",
    icon: Shirt,
    title: "Appearance",
    titleHi: "व्यक्तित्व और लुक",
    steps: [
      { en: "Simple morning grooming routine", hi: "सुबह की आसान ग्रूमिंग रूटीन" },
      { en: "5 clean well-fitting outfits", hi: "5 साफ़, फिटिंग वाले कपड़े" },
      { en: "Skin + hair basics twice daily", hi: "दिन में दो बार स्किन और बाल की देखभाल" },
      { en: "Posture check every work hour", hi: "हर घंटे पॉश्चर सुधारें" },
    ],
  },
  {
    key: "confidence",
    icon: Sparkles,
    title: "Confidence",
    titleHi: "आत्मविश्वास",
    steps: [
      { en: "Speak up once daily, on purpose", hi: "रोज़ एक बार जानबूझकर अपनी बात कहें" },
      { en: "Weekly win list — 3 lines", hi: "हफ़्ते की जीत — 3 लाइनें लिखें" },
      { en: "Cold shower or hard task first", hi: "दिन की शुरुआत मुश्किल काम से" },
      { en: "Eye contact + slow speech practice", hi: "आँख मिलाकर, धीरे बोलने का अभ्यास" },
    ],
  },
  {
    key: "skills",
    icon: Brain,
    title: "Skills",
    titleHi: "स्किल्स",
    steps: [
      { en: "Pick one skill for 90 days", hi: "90 दिन के लिए एक स्किल चुनें" },
      { en: "45 min deep practice, 5 days a week", hi: "हफ़्ते में 5 दिन 45 मिनट गहरा अभ्यास" },
      { en: "Build one small real project", hi: "एक छोटा असली प्रोजेक्ट बनाएँ" },
      { en: "Show your work publicly once", hi: "अपना काम एक बार सबको दिखाएँ" },
    ],
  },
  {
    key: "work",
    icon: Timer,
    title: "Work",
    titleHi: "काम",
    steps: [
      { en: "Top 3 tasks written before 10am", hi: "सुबह 10 बजे से पहले 3 ज़रूरी काम लिखें" },
      { en: "Two 90-min focus blocks daily", hi: "रोज़ दो 90-मिनट के फोकस ब्लॉक" },
      { en: "Phone outside the room while working", hi: "काम के समय फ़ोन कमरे से बाहर" },
      { en: "Weekly review every Sunday", hi: "हर रविवार हफ़्ते की समीक्षा" },
    ],
  },
  {
    key: "savings",
    icon: Banknote,
    title: "Savings",
    titleHi: "बचत",
    steps: [
      { en: "Track every rupee for 30 days", hi: "30 दिन तक हर रुपया ट्रैक करें" },
      { en: "Auto-save 20% on salary day", hi: "सैलरी वाले दिन 20% अपने आप बचाएँ" },
      { en: "One month emergency fund", hi: "एक महीने का इमरजेंसी फंड" },
      { en: "Cut 3 useless subscriptions", hi: "3 बेकार सब्सक्रिप्शन बंद करें" },
    ],
  },
  {
    key: "discipline",
    icon: Dumbbell,
    title: "Discipline",
    titleHi: "अनुशासन",
    steps: [
      { en: "Same wake time for 21 days", hi: "21 दिन एक ही समय पर उठें" },
      { en: "Harmful habit down by 50%", hi: "नुकसानदेह आदत 50% कम करें" },
      { en: "Screens off 45 min before bed", hi: "सोने से 45 मिनट पहले स्क्रीन बंद" },
      { en: "Never miss twice in a row", hi: "लगातार दो बार कभी न छोड़ें" },
    ],
  },
  {
    key: "social",
    icon: Users,
    title: "Social circle",
    titleHi: "संगत",
    steps: [
      { en: "List who lifts you and who drains you", hi: "कौन उठाता है, कौन थकाता है — लिखें" },
      { en: "Set one clear boundary kindly", hi: "प्यार से एक साफ़ सीमा तय करें" },
      { en: "Meet one growth-minded person monthly", hi: "महीने में एक अच्छे सोच वाले व्यक्ति से मिलें" },
      { en: "Call family weekly", hi: "हर हफ़्ते परिवार से बात करें" },
    ],
  },
];

function RoadmapPage() {
  const { state, toggleRoadmapStep } = useStore();
  const lang = state.profile.language;
  const hi = lang === "hindi";
  const premium = state.profile.plan === "premium";

  const totalSteps = PILLARS.length * 4;
  const doneSteps = PILLARS.reduce(
    (n, p) => n + p.steps.filter((_, i) => state.roadmap[`${p.key}:${i}`]).length,
    0,
  );
  const pct = Math.round((doneSteps / totalSteps) * 100);

  if (!premium) {
    return (
      <AppShell title={t(lang, "roadmap.title")} subtitle={t(lang, "roadmap.locked")} backTo="/dashboard">
        <Card className="hero-gradient space-y-3 text-center">
          <Crown className="mx-auto h-8 w-8 text-gold" aria-hidden />
          <h2 className="font-display text-xl font-semibold">{t(lang, "roadmap.title")}</h2>
          <p className="text-sm text-muted-foreground">{t(lang, "roadmap.subtitle")}</p>
          <Link
            to="/upgrade"
            className="press flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)]"
          >
            <Crown className="h-4 w-4" aria-hidden /> {t(lang, "common.upgrade")}
          </Link>
        </Card>
        {PILLARS.map(({ key, icon: Icon, title, titleHi }) => (
          <Card key={key} className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="min-w-0 flex-1 text-sm">{hi ? titleHi : title}</p>
            <Lock className="h-4 w-4 text-gold" aria-hidden />
          </Card>
        ))}
        <Disclaimer text={hi ? t(lang, "disclaimer") : DISCLAIMER} />
      </AppShell>
    );
  }

  return (
    <AppShell title={t(lang, "roadmap.title")} subtitle={t(lang, "roadmap.subtitle")} backTo="/dashboard">
      <Card className="hero-gradient space-y-2">
        <div className="flex items-end justify-between">
          <p className="font-display text-3xl font-bold">{pct}%</p>
          <p className="text-xs text-muted-foreground">
            {doneSteps}/{totalSteps} {t(lang, "roadmap.progress")}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
      </Card>

      {PILLARS.map(({ key, icon: Icon, title, titleHi, steps }) => {
        const done = steps.filter((_, i) => state.roadmap[`${key}:${i}`]).length;
        return (
          <div key={key} className="space-y-2">
            <SectionTitle right={<span className="text-xs text-muted-foreground">{done}/{steps.length}</span>}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                {hi ? titleHi : title}
              </span>
            </SectionTitle>
            <Card className="space-y-2">
              {steps.map((step, i) => {
                const stepKey = `${key}:${i}`;
                const checked = !!state.roadmap[stepKey];
                return (
                  <button
                    key={stepKey}
                    onClick={() => toggleRoadmapStep(stepKey)}
                    aria-pressed={checked}
                    className="press flex w-full items-center gap-3 rounded-xl bg-elevated px-3 py-3 text-left"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {checked ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-sm ${checked ? "text-muted-foreground line-through" : ""}`}
                    >
                      {hi ? step.hi : step.en}
                    </span>
                  </button>
                );
              })}
            </Card>
          </div>
        );
      })}

      <Disclaimer text={hi ? t(lang, "disclaimer") : DISCLAIMER} />
    </AppShell>
  );
}
