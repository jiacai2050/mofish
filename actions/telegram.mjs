import fs from "fs";

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1002672418956";
const MESSAGE_FILE = process.env.TELEGRAM_MESSAGE_FILE || "telegram-bot.md";
const api = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

const message = fs.readFileSync(MESSAGE_FILE, "utf8");
console.log(message);
const payload = JSON.stringify({
  text: message,
  chat_id: CHAT_ID,
  parse_mode: "MarkdownV2",
  link_preview_options: { is_disabled: true },
});

const ret = await fetch(api, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: payload,
});

if (!ret.ok) {
  throw new Error(await ret.text());
}
