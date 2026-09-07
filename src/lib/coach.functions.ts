import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(30),
  context: z.string().max(4000),
  language: z.enum(["english", "hinglish", "hindi"]),
});

export const askCoach = createServerFn({ method: "POST" })
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI coach is not configured yet. Add GEMINI_API_KEY to your environment.");

    const system = `You are "LIFE AI COACH" inside the LIFE UPGRADE app: a warm, respectful personal trainer + life coach.
Rules:
- Never shame the user for smoking, drinking, laziness, weight, spending or relapse. Relapse is data, not failure.
- Reduce harmful habits gradually and safely; never force sudden quitting, never claim medical treatment or diagnosis.
- Recommend a doctor, therapist or helpline when the user shows heavy dependence, withdrawal symptoms, or mental-health distress.
- Only use data the user typed in the app. Never suggest monitoring anyone's phone, messages, calls or private activity.
- For "bad friends / bad environment", coach healthy boundaries and better circles — never spying.
- Be concrete: give short plans with times, reps, minutes, and healthy alternatives for urges.
- Keep replies under 180 words, use short lines and simple bullets. No markdown headers.
Reply language: ${data.language === "hindi" ? "Hindi (Devanagari)" : data.language === "hinglish" ? "Hinglish (Roman script Hindi + English mix)" : "English"}.
User data snapshot: ${data.context}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }],
        },
        contents: data.messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Coach is busy right now. Try again in a moment.");
      throw new Error(`Coach unavailable (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const reply =
      json.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("")
        .trim() || "I'm here. Tell me more.";

    return { reply };
  });
