require('../../dep');
const ejs = require('ejs');
const fs = require('fs');
const { Query } = require('leancloud-storage');
const moment = require('moment');
const { Console } = require('console');
const { POST_TABLE_NAME, ONLINE_TABLE_NAME } = require('./common')

async function fetch_post(start_ts, end_ts) {
  let q = new Query(POST_TABLE_NAME);
  q.limit(1000);
  q.greaterThanOrEqualTo('created', start_ts);
  q.lessThan('created', end_ts);
  q.descending('replies');

  let results = await q.find();
  let posts = [];
  for(let post of results) {
    let o = {
      id: post.get('id'),
      node: post.get('node')['title'],
      node_url: post.get('node')['url'],
      node_image: post.get('node')['avatar_mini'],
      description: post.get('content_rendered'),
      url: post.get('url'),
      replies: post.get('replies'),
      created: moment(post.get('created') * 1000).format('hh:mm:ss'),
      title: post.get('title'),
      author: post.get('member')['username'],
      author_url: post.get('member')['url'],
      author_image: post.get('member')['avatar_mini'],
    }
    posts.push(o);
  }
  return posts;
}

if (require.main === module) {
  const file_opts = {'encoding': 'utf8', 'flags': 'a'};
  const github_sha = process.env.GITHUB_SHA || 'master';
  const github_repo = process.env.GITHUB_REPOSITORY || 'jiacai2050/v2ex';

  const myArgs = process.argv.slice(2);
  const output = myArgs[0] || 'v2ex_result.html';
  const file_console = new Console(fs.createWriteStream(output, file_opts));

  let today = moment().startOf('day');
  const start_ts = today.unix();
  const end_ts = today.add(-1, 'd').unix();

  (async () => {
    let posts = await fetch_post(start_ts, end_ts);
    let tmpl = fs.readFileSync(`${__dirname}/../../public/mail_v2ex.ejs`, file_opts);
    let body = ejs.render(tmpl, {
      posts: posts,
      github_sha: github_sha,
      github_repo: github_repo
    }, {});
    file_console.log(body);
  })()
}

module.exports = { fetch_post };
