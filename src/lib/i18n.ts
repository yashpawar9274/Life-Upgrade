import type { Profile } from "./store";

export type Lang = Profile["language"];

type Dict = Record<string, string>;

/** Hindi (Devanagari) copy. Any key missing here falls back to English. */
const HI: Dict = {
  "nav.home": "होम",
  "nav.routine": "रूटीन",
  "nav.progress": "प्रगति",
  "nav.coach": "AI कोच",
  "nav.profile": "प्रोफ़ाइल",
  "nav.roadmap": "रोडमैप",

  "common.premium": "प्रीमियम",
  "common.upgrade": "अपग्रेड",
  "common.all": "सभी",
  "common.today": "आज",
  "common.free": "फ्री प्लान",
  "common.premiumMember": "प्रीमियम सदस्य",

  "dash.hey": "नमस्ते",
  "dash.todayScore": "आज का स्कोर",
  "dash.streak": "दिन की लगातार लय",
  "dash.level": "स्तर",
  "dash.keyFocus": "अभी का मुख्य काम",
  "dash.allDone": "आज का पूरा रूटीन हो गया 🎉",
  "dash.openRoutine": "रूटीन खोलें",
  "dash.mood": "मूड चेक-इन",
  "dash.moodLogged": "दर्ज हो गया। सच बताने के लिए धन्यवाद — हम आपकी असली स्थिति के हिसाब से प्लान बनाते हैं।",
  "dash.motivation": "आज की प्रेरणा",
  "dash.quick": "जल्दी चेक-इन",
  "dash.toolkit": "आपके टूल",
  "dash.coachSub": "हिंदी, हिंग्लिश या अंग्रेज़ी में बात करें",
  "dash.coachLocked": "प्रीमियम — व्यक्तिगत रूटीन और जवाबदेही",

  "link.routine": "आज का रूटीन",
  "link.habits": "आदतें और लय",
  "link.limits": "बुरी आदतों की सीमा",
  "link.plans": "वर्कआउट और ध्यान",
  "link.focus": "फोकस मोड",
  "link.report": "साप्ताहिक रिपोर्ट",

  "mood.happy": "खुश",
  "mood.motivated": "जोश में",
  "mood.focused": "एकाग्र",
  "mood.stressed": "तनाव में",
  "mood.low-energy": "कम ऊर्जा",
  "mood.anxious": "बेचैन",

  "level.Reset": "रीसेट",
  "level.Discipline": "अनुशासन",
  "level.Growth": "विकास",
  "level.Elite Routine": "एलीट रूटीन",

  "roadmap.title": "लक्ज़री लाइफ रोडमैप",
  "roadmap.subtitle": "आठ स्तंभ — छोटे कदम, बड़ी ज़िंदगी",
  "roadmap.locked": "प्रीमियम में उपलब्ध",
  "roadmap.progress": "पूरा हुआ",

  "install.title": "LIFE UPGRADE इंस्टॉल करें",
  "install.body": "होम स्क्रीन पर जोड़ें और ऐप की तरह इस्तेमाल करें — ऑफलाइन चेक-इन के साथ।",
  "install.cta": "होम स्क्रीन पर जोड़ें",
  "install.later": "बाद में",

  "coach.voice": "वॉइस मोड",
  "coach.listening": "सुन रहा हूँ…",
  "coach.speaking": "बोल रहा हूँ…",
  "coach.placeholder": "अपने कोच से बात करें…",

  "disclaimer":
    "यह ऐप आपके व्यक्तिगत कल्याण में मदद करता है और चिकित्सकीय या मानसिक-स्वास्थ्य देखभाल का विकल्प नहीं है।",
};

const EN: Dict = {
  "nav.home": "Home",
  "nav.routine": "Routine",
  "nav.progress": "Progress",
  "nav.coach": "AI Coach",
  "nav.profile": "Profile",
  "nav.roadmap": "Roadmap",

  "common.premium": "Premium",
  "common.upgrade": "Upgrade",
  "common.all": "All",
  "common.today": "Today",
  "common.free": "Free plan",
  "common.premiumMember": "Premium member",

  "dash.hey": "Hey",
  "dash.todayScore": "Today's score",
  "dash.streak": "day streak",
  "dash.level": "Level",
  "dash.keyFocus": "Key focus now",
  "dash.allDone": "All routine blocks done 🎉",
  "dash.openRoutine": "Open routine",
  "dash.mood": "Mood check-in",
  "dash.moodLogged": "Logged. Thanks for being honest — we plan around how you actually feel.",
  "dash.motivation": "Daily motivation",
  "dash.quick": "Quick check-ins",
  "dash.toolkit": "Your toolkit",
  "dash.coachSub": "Talk in Hindi, Hinglish or English",
  "dash.coachLocked": "Premium — personalised routines & accountability",

  "link.routine": "Today's routine",
  "link.habits": "Habits & streaks",
  "link.limits": "Bad habit limits",
  "link.plans": "Workout & meditation",
  "link.focus": "Focus mode",
  "link.report": "Weekly report",

  "mood.happy": "Happy",
  "mood.motivated": "Motivated",
  "mood.focused": "Focused",
  "mood.stressed": "Stressed",
  "mood.low-energy": "Low energy",
  "mood.anxious": "Anxious",

  "level.Reset": "Reset",
  "level.Discipline": "Discipline",
  "level.Growth": "Growth",
  "level.Elite Routine": "Elite Routine",

  "roadmap.title": "Luxury Life Roadmap",
  "roadmap.subtitle": "Eight pillars — small steps, bigger life",
  "roadmap.locked": "Available on Premium",
  "roadmap.progress": "complete",

  "install.title": "Install LIFE UPGRADE",
  "install.body": "Add it to your home screen and use it like an app — with offline check-ins.",
  "install.cta": "Add to home screen",
  "install.later": "Later",

  "coach.voice": "Voice mode",
  "coach.listening": "Listening…",
  "coach.speaking": "Speaking…",
  "coach.placeholder": "Talk to your coach…",

  "disclaimer":
    "This app supports personal wellbeing and is not a substitute for medical or mental-health care.",
};

export function t(lang: Lang, key: string): string {
  if (lang === "hindi") return HI[key] ?? EN[key] ?? key;
  return EN[key] ?? key;
}

export const MOTIVATIONS_HI = [
  "अनुशासन का मतलब है — जो अभी अच्छा लगता है उसकी जगह जो सच में चाहिए वो चुनना।",
  "परफेक्ट दिन की ज़रूरत नहीं, ईमानदार दिन की ज़रूरत है।",
  "छोटे साफ़ फैसले, रोज़ दोहराए जाएँ, तो लक्ज़री ज़िंदगी बनती है।",
  "आपका आने वाला रूप आज के फैसलों को इज़्ज़त से देख रहा है।",
  "फिर से गिरना डेटा है, पहचान नहीं। रीसेट करो और आगे बढ़ो।",
  "शांत शरीर, साफ़ दिमाग, मज़बूत रूटीन — इसी क्रम में।",
  "एक वॉक, एक ग्लास पानी, एक जल्दी नींद — यही प्रगति है।",
];
