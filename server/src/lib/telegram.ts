import type { Env } from "../types";

type Bindings = Env["Bindings"];

// Direct fetch against the Bot API, matching this backend's existing
// preference for lean, dependency-free calls over gemini.ts/cloudinary.ts.
export async function sendTelegramMessage(env: Bindings, chatId: string, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    console.error(`Telegram sendMessage failed (${res.status}): ${await res.text()}`);
  }
}
