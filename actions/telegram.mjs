import fs from "fs";
import { createTelegraphPage } from "./telegraph.js";

const TOKEN = process.env.TELEGRAM_TOKEN;
const POST_TOKEN = process.env.TELEGRAPH_ACCESS_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1002672418956";
const MESSAGE_FILE = process.env.TELEGRAM_MESSAGE_FILE || "telegram-bot.md";
const POST_FILE = process.env.TELEGRAPH_MESSAGE_FILE || "telegraph.md";
const POST_TITLE = process.env.TELEGRAPH_POST_TITLE || "HN Summary";

async function createTelegrahPost() {
  const content = fs.readFileSync(POST_FILE, "utf8");
  return await createTelegraphPage(POST_TOKEN, POST_TITLE, content);
}

async function sendMessage() {
  const api = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  // const message = fs.readFileSync(MESSAGE_FILE, "utf8");
  // console.log(message);
  const payload = JSON.stringify({
    text: message,
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

const resp = await createTelegrahPost();
console.log(resp);
const post_url = resp.result.url;
const post_title = resp.result.title;
const normalized_title = normalize(post_title);

await sendMessage(`*${normalized_title}*\n${post_url}`);
