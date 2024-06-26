require('../../dep');
const { Object, Query } = require('leancloud-storage');
const cheerio = require('cheerio');
const { POST_TABLE_NAME, ONLINE_TABLE_NAME } = require('./common');

const V2ex = Object.extend(POST_TABLE_NAME);
const OnlineStat = Object.extend(ONLINE_TABLE_NAME);

const fetch_opts = {
  'timeout': 10 * 1000, // 10s
};
async function insert_or_update(post) {
  const query = new Query(POST_TABLE_NAME);
  query.equalTo('url', post.url);
  let ret = await query.first();
  if (ret) {
    console.log('update');
    let id = ret.get('objectId');
    const item = Object.createWithoutData(POST_TABLE_NAME, id);
    delete post.id;
    delete post.url;
    item.set(post);
    return await item.save(null, { fetchWhenSave: true });
  } else {
    console.log('insert');
    let v2ex = new V2ex();
    v2ex.set(post);
    return await v2ex.save(null, { fetchWhenSave: true });
  }
}

async function save_posts() {
  let posts = await fetch_posts();
  for (let post of posts) {
    try {
      console.log(`begin save ${post.id}-${post.title}`);
      let ret = await insert_or_update(post);
      // console.log(ret.toJSON());
      console.log(`done save ${ret.id}-${ret.get('title')}`);
    } catch (e) {
      console.error(e);
    }
  }
}

async function fetch_posts() {
  let body = await fetch('https://www.v2ex.com/api/topics/hot.json', fetch_opts);
  return await body.json();
}

async function save_online() {
  let body = await fetch('https://www.v2ex.com/', fetch_opts);
  body = await body.text();
  let $ = cheerio.load(body, { decodeEntities: false });
  let html = $('div#Bottom div.content div.inner strong').html();
  let m = /(\d+) 人在线/.exec(html);
  if (m) {
    let online_num = parseInt(m[1]);
    console.log(`online num = ${online_num}`);
    let stat = new OnlineStat();
    stat.set('num', online_num);
    stat.save();
  }
}

module.exports = { save_online, save_posts, fetch_posts };

if (require.main === module) {
  (async function() {
    try {
      await save_posts();
    } catch (e) {
      console.log(e);
    }
    try {
      await save_online();
    } catch (e) {
      console.log(e);
    }
  })();
}
