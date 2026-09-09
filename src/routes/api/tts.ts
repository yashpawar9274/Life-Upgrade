import { createFileRoute } from "@tanstack/react-router";

type Body = { text?: unknown; language?: unknown; speed?: unknown };

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
<<<<<<< HEAD
        if (!apiKey) return new Response("Voice coach is not configured", { status: 500 });
=======
        if (!apiKey) return new Response("Voice replies are being configured. Please try again shortly.", { status: 503 });
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)

        const { text, language, speed } = (await request.json()) as Body;
        if (typeof text !== "string" || !text.trim()) {
          return new Response("Text is required", { status: 400 });
        }

        const lang = language === "hindi" ? "Hindi" : language === "hinglish" ? "Hinglish" : "English";
        const input = text.slice(0, 3500);
        const rate = typeof speed === "number" && speed >= 0.7 && speed <= 1.4 ? speed : 1;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input,
            voice: "alloy",
            response_format: "mp3",
            speed: rate,
            instructions: `Speak in ${lang} as a warm, calm, encouraging personal life coach. Natural pacing, never robotic, never shaming.`,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          return new Response(`Voice failed (${res.status}): ${body.slice(0, 200)}`, {
            status: res.status,
          });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
