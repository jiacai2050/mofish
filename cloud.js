const AV = require('leanengine');
const storage = require('leancloud-storage');
const fetch = require('node-fetch');
const cheerio = require('cheerio')
require('./init-lc');

let V2ex = storage.Object.extend('v2ex');

async function insert_or_update(post) {
  const query = new AV.Query('v2ex');
  query.equalTo('url', post.url);
  let ret = await query.first();
  if (!!ret) {
    console.log('update');
    let id = ret.get('objectId');
    const item = AV.Object.createWithoutData('v2ex', id);
    delete post['id'];
    delete post['url'];
    item.set(post);
    return await item.save(null, {fetchWhenSave: true});
  } else {
    console.log('insert');
    let v2ex = new V2ex();
    v2ex.set(post);
    return await v2ex.save(null, {fetchWhenSave: true});
  }
}

async function save_posts() {
  let body = await fetch('https://www.v2ex.com/api/topics/hot.json');
  let hot_posts = await body.json();
  for(let post of hot_posts) {
    try {
      console.log(`begin save ${post.id}-${post.title}`);
      let ret = await insert_or_update(post);
      // console.log(ret.toJSON());
      console.log(`done save ${ret.id}-${ret.get('title')}`);
    } catch(e) {
      console.error(e);
    }
  }
}

async function save_online() {
  let body = await fetch('https://www.v2ex.com/');
  body = await body.text();
  let $ = cheerio.load(body, {decodeEntities: false});
  let html = $('div#Bottom div.content div.inner strong').html();
  let m = /(\d+) 人在线/.exec(html);
  if(m) {
    let online_num = parseInt(m[1]);
    console.log(`online num = ${online_num}`);
    let stat = new OnlineStat();
    stat.set('num', online_num);
    stat.save();
  }
}

AV.Cloud.define('v2ex', (req) => {
  save_posts();
});

let OnlineStat = storage.Object.extend('OnlineStat');

AV.Cloud.define('online_num', (req) => {
  save_online();
});



if (require.main === module) {
  (async function() {
    try {
      await save_posts();
    } catch(e) {
      console.log(e);
    }
    try {
      await save_online();
    } catch(e) {
      console.log(e);
    }
  })();
}
