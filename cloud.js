const AV = require('leanengine');
const storage = require('leancloud-storage');
const rp = require('request-promise');
const cheerio = require('cheerio')


let url = 'https://vubvdkqx.api.lncld.net/1.1/classes/v2ex';
let V2ex = storage.Object.extend('v2ex');

AV.Cloud.define('v2ex', (req) => {
  rp('https://www.v2ex.com/api/topics/hot.json')
    .then((body) => {
      let hot_posts = JSON.parse(body);
      for(let post of hot_posts) {
        let v2ex = new V2ex();
        console.log(`${post.id}`);
        v2ex.set(post);
        v2ex.save();
      }
    });
})

let OnlineStat = storage.Object.extend('OnlineStat');

AV.Cloud.define('online_num', (req) => {
  rp('https://www.v2ex.com/')
    .then((body) => {
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
    });
});
