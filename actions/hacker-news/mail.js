require("../../dep");
const ejs = require("ejs");
const fs = require("fs");
const { Query } = require("leancloud-storage");
const moment = require("moment");
const { Console } = require("console");
const { POST_TABLE_NAME, sleep } = require("./common");
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
    const o = post.toJSON();
    const url = get_post_url(o);
    o["summary"] = (await get_summary(url)) || url;
    add_extra_fields(o);
    posts.push(o);
  }
  return posts;
}

function get_post_url(post) {
  return post["url"] || `https://news.ycombinator.com/item?id=${post["id"]}`;
}

function add_extra_fields(post) {
  post["summary_html"] = marked.parse(post["summary"]);
  const url = get_post_url(post);
  post["created"] = moment(post["time"] * 1000).format("HH:mm:ss");
  post["hostname"] = new URL(url).hostname.replace("www.", "");
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
    // https://developers.cloudflare.com/workers-ai/models/gemma-3-12b-it/
    // context: 80,000
    model: "@cf/google/gemma-3-12b-it",

    // https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/
    // context: 131,000
    // model: "@cf/zai-org/glm-4.7-flash",
  });
  for (let retry = 1; retry <= 5; retry++) {
    const resp = await fetch(
      `https://api.liujiacai.net/ai/summary?${params.toString()}`,
    );
    const text = await resp.text();
    if (resp.ok) {
      return text;
    }

    console.warn(
      `AI summarize failed for ${url}, retry:${retry}, status:${resp.status}, text:${text}`,
    );
    if (resp.status >= 500) {
      await sleep(10000 * retry);
    } else {
      return null;
    }
  }
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

module.exports = { fetch_post, get_post_url, add_extra_fields };
