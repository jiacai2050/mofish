require("../../dep");
const ejs = require("ejs");
const fs = require("fs");
const { Query } = require("leancloud-storage");
const moment = require("moment");
const { Console } = require("console");
const { POST_TABLE_NAME } = require("./common");
const marked = require("marked");

async function fetch_post(start_ts, end_ts) {
  let q = new Query(POST_TABLE_NAME);
  q.limit(50);
  q.greaterThanOrEqualTo("time", start_ts);
  q.lessThan("time", end_ts);
  q.descending("score");

  let results = await q.find();
  let posts = [];
  for (let post of results) {
    let o = post.toJSON();
    o["created"] = moment(post.get("time") * 1000).format("HH:mm:ss");
    const url =
      post.get("url") ||
      `https://news.ycombinator.com/item?id=${post.get("id")}`;

    o["summary"] = (await get_summary(url)) || url;
    o["summary_html"] = marked.parse(o["summary"]);
    o["hostname"] = new URL(url).hostname.replace("www.", "");
    posts.push(o);
  }
  return posts;
}

async function get_summary(url) {
  try {
    const summary = await ai_summarize(url);
    if (summary) {
      return summary;
    }
    return await page_desc(url);
  } catch (err) {
    console.warn(`Get summary failed for ${url}, error: ${err}`);
  }
}

async function page_desc(url) {
  const params = new URLSearchParams({ url });
  const resp = await fetch(
    `https://edgebin.liujiacai.net/page-meta?${params.toString()}`,
  );
  const obj = await resp.json();
  return (
    obj["description"] || obj["og:description"] || obj["twitter:description"]
  );
}

async function ai_summarize(url) {
  const params = new URLSearchParams({
    url,
    model: "@cf/google/gemma-3-12b-it",
  });
  const resp = await fetch(
    `https://api.liujiacai.net/ai/summary?${params.toString()}`,
  );
  const text = await resp.text();
  if (!resp.ok) {
    console.warn(
      `AI summarize failed for ${url}, status:${resp.status}, text:${text}`,
    );
    return null;
  }
  return text;
}

const file_opts = { encoding: "utf8", flags: "a" };

async function main() {
  const github_sha = process.env.GITHUB_SHA || "main";
  const github_repo = process.env.GITHUB_REPOSITORY || "jiacai2050/mofish";

  const myArgs = process.argv.slice(2);
  const output = myArgs[0] || "hackernews_result.html";
  const file_console = new Console(fs.createWriteStream(output, file_opts));

  let today = moment().startOf("day");
  const start_ts = today.unix();
  const end_ts = today.add(-1, "d").unix();
  let posts = await fetch_post(start_ts, end_ts);
  let tmpl = fs.readFileSync(
    `${__dirname}/../../public/mail_hackernews.ejs`,
    file_opts,
  );
  let body = ejs.render(
    tmpl,
    {
      posts: posts,
      github_sha: github_sha,
      github_repo: github_repo,
    },
    {},
  );
  file_console.log(body);
}

if (require.main === module) {
  main();
}

module.exports = { fetch_post };
