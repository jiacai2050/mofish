import { createClient } from "@libsql/client";
import fs from "fs";
import moment from "moment";

const client = createClient({
  url: process.env.TURSO_DB_URL ?? "file:./mofish.db",
  authToken: process.env.TURSO_TOKEN,
});

export async function initDatabase() {
  let sqls = fs
    .readFileSync(`${import.meta.dirname}/../schema.sql`, "utf8")
    .split(";");
  sqls = sqls.filter((sql) => sql.trim().length > 0);
  console.log(sqls, sqls.length);
  const ret = await client.batch(sqls, "write");
  console.log(ret);
}

export async function insertLinks(postDate, github, telegraph) {
  const sql = `
    INSERT INTO hn_links (post_date, github, telegraph)
    VALUES (?, ?, ?)
  `;
  const ret = await client.execute(sql, [postDate, github, telegraph], "write");
  return ret;
}

export async function insertPosts(post_file) {
  const content = fs.readFileSync(post_file, "utf8");
  const posts = JSON.parse(content);
  for (const post of posts) {
    const sql = `
      INSERT INTO hn_posts (id, time, type, descendants, title, score, url, by, text, summary)
      VALUES               (?,  ?,    ?,    ?,           ?,     ?,     ?,   ?,  ?,    ?)
      ON CONFLICT(id) DO UPDATE SET
        time=excluded.time,
        type=excluded.type,
        descendants=excluded.descendants,
        title=excluded.title,
        score=excluded.score,
        url=excluded.url,
        by=excluded.by,
        text=excluded.text,
        summary=excluded.summary
    `;
    const params = [
      post.id,
      post.time,
      post.type,
      post.descendants || 0,
      post.title || "",
      post.score || 0,
      post.url || "",
      post.by || "",
      post.text || "",
      post.summary || "",
    ];
    const ret = await client.execute(sql, params, "write");
    console.log(`Inserted/Updated post id=${post.id}:`, ret);
  }
}

async function main() {
  await initDatabase();
  const postDate = process.env.POST_DATE;
  const github = process.env.GITHUB_ISSUE_URL || "";
  const telegraph = process.env.TELEGRAPH_POST_URL || "";
  if (postDate) {
    const m = moment(postDate, "YYYYMMDD");
    const ts = m.unix();
    const ret = await insertLinks(ts, github, telegraph);
    console.log(`Inserted links for date ${postDate}(${ts}):`, ret);

    const postFile = `${import.meta.dirname}/../data/${m.format("YYYY-MM-DD")}.json`;
    await insertPosts(postFile);
  } else {
    console.log("POST_DATE environment variable is not set.");
  }
}

await main();
