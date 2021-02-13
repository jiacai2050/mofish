const ejs = require('ejs');
const fs = require('fs');
const { Console } = require('console');
const hn = require('./hacker-news/mail');
const v2ex = require('./v2ex/mail');
const juice = require('juice');
const moment = require('moment');
const { argv } = require('yargs');

const github_sha = process.env.GITHUB_SHA || 'master';
const github_repo = process.env.GITHUB_REPOSITORY || 'jiacai2050/v2ex';
const file_opts = { 'encoding': 'utf8', 'flags': 'w' };


async function main() {
  const output = argv.output || 'result.html';
  let day = argv.day || moment().add(-1, 'd').startOf('day');
  if (typeof day === 'number') {
    day = moment(day + '').startOf('day');
  }
  // [start_ts, end_ts)
  const day_str = day.format('YYYY-MM-DD');
  const start_ts = day.unix();
  const end_ts = day.add(1, 'd').unix();
  console.log(output, start_ts, end_ts)

  const file_console = new Console(fs.createWriteStream(output, file_opts));

  let hn_posts = await hn.fetch_post(start_ts, end_ts);
  let v2ex_posts = await v2ex.fetch_post(start_ts, end_ts);

  let tmpl = fs.readFileSync(`${__dirname}/../public/mail.ejs`, file_opts);
  let body = ejs.render(tmpl, {
    hn_posts: hn_posts,
    v2ex_posts: v2ex_posts,
    github_sha: github_sha,
    github_repo: github_repo,
    data_time: day_str,
  }, { views: [`${__dirname}/../public`] });
  file_console.log(juice(body));
}

if (require.main === module) {
  main();
}
