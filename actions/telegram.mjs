import fs from "fs";

const TOKEN = process.env.TELEGRAM_TOKEN;
const POST_TOKEN = process.env.TELEGRAPH_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1002672418956";
const MESSAGE_FILE = process.env.TELEGRAM_MESSAGE_FILE || "telegram-bot.md";

const POST_URL =
  process.env.TELEGRAPH_POST_URL || "https://github.com/jiacai2050/mofish";
const POST_TITLE = process.env.TELEGRAPH_POST_TITLE || "HNew Digst";

async function sendMessage() {
  const api = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const message = fs.readFileSync(MESSAGE_FILE, "utf8");
  const text = `View it on the web at [${normalize(POST_TITLE)}](${POST_URL})\n\n${message}`;
  // console.log(message);
  const payload = JSON.stringify({
    text,
    chat_id: CHAT_ID,
    parse_mode: "MarkdownV2",
  });

  const ret = await fetch(api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  });

  if (!ret.ok) {
    throw new Error(
      `Telegram sendMessage failed: ${ret.status}, body: ${await ret.text()}`,
    );
  }
}

// https://core.telegram.org/bots/api#markdownv2-style
function normalize(title) {
  return title.replace(/([-_*\[\]()~`>#+=|{}.!])/g, "\\$1");
}

await sendMessage();
