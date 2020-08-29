require('../../init-lc');
const ejs = require('ejs');
const fs = require('fs');
const { Query } = require('leancloud-storage');
const moment = require('moment');
const { Console } = require('console');
const { POST_TABLE_NAME, ONLINE_TABLE_NAME } = require('./common')

const file_opts = {'encoding': 'utf8', 'flags': 'a'};
const git_sha = process.env.GIT_SHA || 'master';

const myArgs = process.argv.slice(2);
const output = myArgs[0] || 'hackernews_result.html';
const file_console = new Console(fs.createWriteStream(output, file_opts));

async function fetch_post() {
  let today = moment().startOf('day');
  let yesterday = moment().add(-1, 'd').startOf('day');
  // console.log(today.toString(), yesterday.toString());
  let q = new Query(POST_TABLE_NAME);
  q.limit(50);
  q.greaterThanOrEqualTo('time', yesterday.unix());
  q.lessThan('time', today.unix());
  q.descending('score');

  let results = await q.find();
  let posts = [];
  for(let post of results) {
    let o = post.toJSON();
    o['created'] = moment(post.get('time') * 1000).format('YYYY-MM-DD hh:mm:ss'),
    posts.push(o);
  }
  let tmpl = fs.readFileSync(`${__dirname}/../../public/mail_hackernews.ejs`, file_opts);
  let body = ejs.render(tmpl, {posts: posts, git_sha: git_sha}, {});
  file_console.log(body);
}

if (require.main === module) {
  fetch_post();
}
