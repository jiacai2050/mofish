require('../../dep');
const ejs = require('ejs');
const fs = require('fs');
const { Query } = require('leancloud-storage');
const moment = require('moment');
const { Console } = require('console');
const { POST_TABLE_NAME, ONLINE_TABLE_NAME } = require('./common')

async function fetch_post(start_ts, end_ts) {
  let q = new Query(POST_TABLE_NAME);
  q.limit(50);
  q.greaterThanOrEqualTo('time', start_ts);
  q.lessThan('time', end_ts);
  q.descending('score');

  let results = await q.find();
  let posts = [];
  for(let post of results) {
    let o = post.toJSON();
    o['created'] = moment(post.get('time') * 1000).format('YYYY-MM-DD hh:mm:ss'),
    posts.push(o);
  }
  return posts;
}

if (require.main === module) {
  const file_opts = {'encoding': 'utf8', 'flags': 'a'};
  const github_sha = process.env.GITHUB_SHA || 'master';
  const github_repo = process.env.GITHUB_REPOSITORY || 'jiacai2050/v2ex';

  const myArgs = process.argv.slice(2);
  const output = myArgs[0] || 'hackernews_result.html';
  const file_console = new Console(fs.createWriteStream(output, file_opts));

  let today = moment().startOf('day');
  const start_ts = today.unix();
  const end_ts = today.add(-1, 'd').unix();
  (async () => {
    let posts = await fetch_post(start_ts, end_ts);
    let tmpl = fs.readFileSync(`${__dirname}/../../public/mail_hackernews.ejs`, file_opts);
    let body = ejs.render(tmpl, {
      posts: posts,
      github_sha: github_sha,
      github_repo: github_repo
    }, {});
    file_console.log(body);
  })()
}

module.exports = { fetch_post };
