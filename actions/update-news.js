require("../dep");
const fs = require("fs");
const moment = require("moment");
const { argv } = require("yargs");
const hn = require("./hacker-news/mail");

const DATA_DIR = `${__dirname}/../data`;

async function main() {
  if (!argv.day) {
    console.error("Usage: node actions/update-news.js --day YYYY-MM-DD");
    process.exit(1);
  }
  let day = typeof argv.day === "number" ? String(argv.day) : argv.day;
  const dayMoment = moment(day).startOf("day");
  const day_str = dayMoment.format("YYYY-MM-DD");
  const start_ts = dayMoment.unix();
  const end_ts = dayMoment.clone().add(1, "d").unix();

  console.log(`Fetching posts for ${day_str} [${start_ts}, ${end_ts})`);

  const filepath = `${DATA_DIR}/${day_str}.json`;
  if (!argv.overwrite && fs.existsSync(filepath)) {
    console.log(`Skip: ${filepath} already exists`);
    return;
  }

  const posts = await hn.fetch_post(start_ts, end_ts);
  console.log(`Fetched ${posts.length} posts`);

  // Clean up fields before saving
  for (const post of posts) {
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
  console.log(`Saved ${posts.length} posts to ${filepath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
