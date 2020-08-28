const ejs = require('ejs');
const fs = require('fs');
const storage = require('leancloud-storage');
const moment = require('moment');
const { Console } = require('console');

const _ = require('./init-lc');
const fileOpts = {'encoding': 'utf8'};
const git_sha = process.env.GIT_SHA || 'master';

var myArgs = process.argv.slice(2);
const output = myArgs[0] || 'result.html';
const console = new Console(fs.createWriteStream(output, fileOpts));

async function fetch_post() {
  let today = moment().startOf('day');
  let yesterday = moment().add(-1, 'd').startOf('day');
  // console.log(today.toString(), yesterday.toString());
  let q = new storage.Query('v2ex');
  q.limit(1000);
  q.greaterThanOrEqualTo('created', yesterday.unix());
  q.lessThan('created', today.unix());
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
      created: moment(post.get('created') * 1000).format('YYYY-MM-DD hh:mm:ss'),
      title: post.get('title'),
      author: post.get('member')['username'],
      author_url: post.get('member')['url'],
      author_image: post.get('member')['avatar_mini'],
    }
    posts.push(o);
  }
  let tmpl = fs.readFileSync('./public/tmpl.ejs', fileOpts);
  let body = ejs.render(tmpl, {posts: posts, git_sha: git_sha}, {});
  console.log(body);
}

if (require.main === module) {
  fetch_post();
}
