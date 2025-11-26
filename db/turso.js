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

await initDatabase();
const postDate = process.env.POST_DATE;
const github = process.env.GITHUB_ISSUE_URL || "";
const telegraph = process.env.TELEGRAPH_POST_URL || "";
if (postDate) {
  const m = moment(postDate, "YYYYMMDD");
  const ts = m.unix();
  const ret = await insertLinks(ts, github, telegraph);
  console.log(`Inserted links for date ${postDate}(${ts}):`, ret);
} else {
  console.log("POST_DATE environment variable is not set.");
}
