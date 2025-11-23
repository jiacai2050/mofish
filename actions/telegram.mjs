import fs from "fs";
import { createTelegraphPage } from "./telegraph.js";

const TOKEN = process.env.TELEGRAM_TOKEN;
const POST_TOKEN = process.env.TELEGRAPH_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-1002672418956";
const MESSAGE_FILE = process.env.TELEGRAM_MESSAGE_FILE || "telegram-bot.md";
const POST_FILE = process.env.TELEGRAPH_MESSAGE_FILE || "telegraph.md";
const POST_TITLE = process.env.TELEGRAPH_POST_TITLE || "HN Summary";

async function createTelegrahPost() {
  const content = fs.readFileSync(POST_FILE, "utf8");
  return await createTelegraphPage(POST_TOKEN, POST_TITLE, content, {
    authorUrl: "https://github.com/jiacai2050/mofish/",
  });
}

async function sendMessage(post_title, post_url) {
  const api = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const message = fs.readFileSync(MESSAGE_FILE, "utf8");
  const text = `View it on the web at [${normalize(post_title)}](${post_url})\n\n${message}`;
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

const resp = await createTelegrahPost();
console.log(resp);
// {
//   ok: true,
//   result: {
//     path: 'HN-Summary-11-23',
//     url: 'https://telegra.ph/HN-Summary-11-23',
//     title: 'HN Summary',
//     description: '',
//     views: 0,
//     can_edit: true
//   }
// }
const post_url = resp.result.url;
const post_title = resp.result.title;

try {
  const output = process.env.GITHUB_OUTPUT || "/tmp/github_output.txt";
  for (const [k, v] of Object.entries(resp.result)) {
    fs.appendFileSync(output, `${k}=${v}\n`);
  }
} catch (e) {
  console.warn(`Write github output failed: ${e}`);
}

await sendMessage(post_title, post_url);
