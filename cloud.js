const AV = require('leanengine');
const _ = require('./init-lc');
const storage = require('leancloud-storage');
const rp = require('request-promise');
const cheerio = require('cheerio')


let url = 'https://vubvdkqx.api.lncld.net/1.1/classes/v2ex';
let V2ex = storage.Object.extend('v2ex');

async function save_posts() {
  let body = await rp('https://www.v2ex.com/api/topics/hot.json');
  let hot_posts = JSON.parse(body);
  for(let post of hot_posts) {
    let v2ex = new V2ex();
    console.log(`${post.id}`);
    v2ex.set(post);
    v2ex.save();
  }
}

async function save_online() {
  let body = await rp('https://www.v2ex.com/');
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
