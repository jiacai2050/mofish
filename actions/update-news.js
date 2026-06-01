require("../dep");
const fs = require("fs");
const moment = require("moment");
const { argv } = require("yargs");
const { Query } = require("leancloud-storage");
const { JSDOM, VirtualConsole } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const DATA_DIR = `${__dirname}/../data`;
const POST_TABLE_NAME = "hackernews";
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0';

const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function main() {
  if (!argv.day) {
    console.error("Usage: node actions/update-news.js --day YYYY-MM-DD");
    console.error("Env: OPENAI_API_URL, OPENAI_API_KEY, OPENAI_MODEL");
    process.exit(1);
  }
  if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is required");
    process.exit(1);
  }

  let day = typeof argv.day === "number" ? String(argv.day) : argv.day;
  const dayMoment = moment(day).startOf("day");
  const day_str = dayMoment.format("YYYY-MM-DD");
  const start_ts = dayMoment.unix();
  const end_ts = dayMoment.clone().add(1, "d").unix();

  console.log(`Fetching posts for ${day_str} [${start_ts}, ${end_ts})`);

  const filepath = `${DATA_DIR}/${day_str}.json`;
  let posts;

  if (fs.existsSync(filepath)) {
    // Load existing data, re-summarize posts with short summaries
    posts = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    console.log(`Loaded ${posts.length} posts from existing file`);
    let updated = 0;
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      if (post.summary && post.summary.length >= 100) continue;
      const url = post.url || `https://news.ycombinator.com/item?id=${post.id}`;
      console.log(`[${i + 1}/${posts.length}] Re-summarizing: ${url}`);
      try {
        const content = await extractContent(url);
        if (content && content.length > 0) {
          post.summary = await summarize(content, post.title);
          updated++;
        }
      } catch (e) {
        console.warn(`  Failed: ${e.message}`);
      }
    }
    console.log(`Updated ${updated} summaries`);
  } else {
    // Fetch posts from LeanCloud
    let q = new Query(POST_TABLE_NAME);
    q.limit(50);
    q.greaterThanOrEqualTo("time", start_ts);
    q.lessThan("time", end_ts);
    q.descending("score");
    const results = (await q.find()) || [];
    posts = results.map((r) => r.toJSON());
    console.log(`Fetched ${posts.length} posts from LeanCloud`);

    // Summarize each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const url = post.url || `https://news.ycombinator.com/item?id=${post.id}`;
      console.log(`[${i + 1}/${posts.length}] Summarizing: ${url}`);
      try {
        const content = await extractContent(url);
        if (content && content.length > 0) {
          post.summary = await summarize(content, post.title);
        }
      } catch (e) {
        console.warn(`  Failed: ${e.message}`);
        post.summary = "";
      }
    }

    // Clean up fields before saving
    for (const post of posts) {
      for (const field of ["kids", "createdAt", "updatedAt", "objectId"]) {
        delete post[field];
      }
    }
  }

  fs.writeFileSync(filepath, JSON.stringify(posts));
  console.log(`Saved ${posts.length} posts to ${filepath}`);
}

async function extractContent(url) {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    const virtualConsole = new VirtualConsole();
    const dom = new JSDOM(html, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.textContent && article.textContent.trim().length > 100) {
      return article.textContent;
    }
  } catch (e) {
    console.warn(`  Readability failed: ${e.message}, trying fallback...`);
  }
  const resp = await fetch(`https://api.liujiacai.net/ai/markdown?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`Fallback API error: ${resp.status}`);
  return await resp.text();
}

const SUMMARY_SYSTEM_PROMPT = `
Your task is to read the provided content and generate a concise,
accurate summary that captures the main points and essential details in less than 800 words.
Do not include personal opinions or information not present in the original content.
If the content is technical (such as code or documentation), focus on summarizing its purpose,
structure, and key functionality. Reply using markdown format, and Chinese language.

⚠️ STRICTION:
- Start directly with the summary content.
- Do NOT include any introductory or concluding remarks, such as "Here is the summary:", "好的，以下是...", or "收到".
- Go straight into the markdown content.`;

async function summarize(content, title) {
  if (!content) return "";
  const resp = await fetch(OPENAI_API_URL + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: SUMMARY_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `文章标题：${title}\n\n文章内容：\n${content}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(60000*3),
  });

  // const text = await resp.text();
  // console.log(`Get ${text}`);
  // const data = JSON.parse(text);
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} ${JSON.stringify(data)}`);
  }
  return data.choices[0].message.content;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
