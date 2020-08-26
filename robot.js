const ejs = require('ejs');
const fs = require('fs');
const storage = require('leancloud-storage');
const moment = require('moment');

const _ = require('./init-lc');

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
      description: post.get('content_rendered'),
      url: post.get('url'),
      replies: post.get('replies'),
      created: moment(post.get('created') * 1000).format('YYYY-MM-DD hh:mm:ss'),
      title: post.get('title')
    }
    posts.push(o);
  }
  let tmpl = fs.readFileSync('./public/tmpl.ejs', {'encoding': 'utf8'});
  let body = ejs.render(tmpl, {posts: posts}, {});
  console.log(body);

}

if (require.main === module) {
  fetch_post();
}
