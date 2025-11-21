const ejs = require("ejs");
const fs = require("fs");
const { Console } = require("console");
const hn = require("./hacker-news/mail");
const v2ex = require("./v2ex/mail");
const juice = require("juice");
const moment = require("moment");
const { argv } = require("yargs");

const github_sha = process.env.GITHUB_SHA || "main";
const github_repo = process.env.GITHUB_REPOSITORY || "jiacai2050/mofish";
const file_opts = { encoding: "utf8", flags: "w" };

async function main() {
  const html_file = argv.htmloutput || "html-part.html";
  const text_file = argv.textoutput || "text-part.txt";
  const github_file = argv.issueoutput || "github-issue.md";
  const telegram_file = argv.telegramoutput || "telegram-bot.md";
  let day = argv.day || moment().add(-1, "d").startOf("day");
  if (typeof day === "number") {
    day = moment(day + "").startOf("day");
  }
  // [start_ts, end_ts)
  const day_str = day.format("YYYY-MM-DD");
  const start_ts = day.unix();
  const end_ts = day.add(1, "d").unix();
  console.log(html_file, start_ts, end_ts);

  const html_writer = new Console(fs.createWriteStream(html_file, file_opts));
  const text_writer = new Console(fs.createWriteStream(text_file, file_opts));
  const github_writer = new Console(
    fs.createWriteStream(github_file, file_opts),
  );
  const telegram_writer = new Console(
    fs.createWriteStream(telegram_file, file_opts),
  );

  let hn_posts = [];
  let titles = [];
  try {
    hn_posts = await hn.fetch_post(start_ts, end_ts);
  } catch (e) {
    console.log(`fetch hn post failed: ${e}`);
  }
  for (let post of hn_posts.slice(0, 2)) {
    titles.push(post.title.replaceAll('"', ""));
  }

  let v2ex_posts = [];
  try {
    v2ex_posts = await v2ex.fetch_post(start_ts, end_ts);
  } catch (e) {
    console.log(`fetch v2ex post failed: ${e}`);
  }

  for (let [tmpl_file, writer] of [
    ["html_mail.ejs", html_writer],
    ["text_mail.ejs", text_writer],
    ["issue.ejs", github_writer],
    ["telegram.ejs", telegram_writer],
  ]) {
    let tmpl = fs.readFileSync(
      `${__dirname}/../public/${tmpl_file}`,
      file_opts,
    );
    let body = ejs.render(
      tmpl,
      {
        hn_posts: hn_posts,
        v2ex_posts: v2ex_posts,
        github_sha: github_sha,
        github_repo: github_repo,
        data_time: day_str,
        title: titles.join(" — "),
      },
      { views: [`${__dirname}/../public`] },
    );
    writer.log(juice(body));
  }

  try {
    const f = `${__dirname}/../data/${day_str}.json`;
    saveHNToFile(f, hn_posts);
  } catch (e) {
    console.error(`save hn post failed: ${e}`);
  }
}

if (require.main === module) {
  main();
}

function saveHNToFile(filepath, posts) {
  console.log(
    `Write hn post to local file: ${filepath}; total ${posts.length} posts`,
  );
  for (let post of posts) {
    for (const field of [
      "summary_html",
      "created",
      "hostname",
      "kids",
      "createdAt",
      "updatedAt",
      "objectId",
    ]) {
      delete post[field];
    }
  }
  fs.writeFileSync(filepath, JSON.stringify(posts));
}
