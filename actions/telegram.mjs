import fs from 'fs';

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MESSAGE_FILE = process.env.TELEGRAM_MESSAGE_FILE;
const api = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

const message = fs.readFileSync(MESSAGE_FILE, 'utf8')
      .replaceAll('-', '/')
      .replaceAll('+', ' ')
      .replaceAll('#', ' ')
      .replaceAll('|', ' ');
console.log(message);

const ret = await fetch(api, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    'text': message,
    'chat_id': CHAT_ID,
    'parse_mode': 'MarkdownV2',
  })
});

if(!ret.ok) {
  throw new Error(await ret.text());
}
