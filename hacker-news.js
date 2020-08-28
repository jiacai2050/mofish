const AV = require('leanengine');
const storage = require('leancloud-storage');
const fetch = require('node-fetch');
require('./init-lc');

const TABLE_NAME = 'hackernews';
const Table = storage.Object.extend(TABLE_NAME);

async function insert_or_update(post) {
  const query = new AV.Query(TABLE_NAME);
  query.equalTo('id', post.id);
  let ret = await query.first();
  if (!!ret) {
    console.log('update');
    let id = ret.get('objectId');
    const item = AV.Object.createWithoutData(TABLE_NAME, id);
    delete post['id'];
    item.set(post);
    return await item.save(null, {fetchWhenSave: true});
  } else {
    console.log('insert');
    let table = new Table();
    table.set(post);
    return await table.save(null, {fetchWhenSave: true});
  }
}

async function batchSave(posts) {
  for (let batch of partition(posts, 200)) {
    let posts = batch.map((post) => {
      let table = new Table();
      table.set(post);
      return table;
    });
    try {
      let ret = await AV.Object.saveAll(posts);
      console.log(ret);
    } catch(e) {
      console.error(e);
    }
  }
}

async function save_posts() {
  let body = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  let ids = await body.json();
  body = await fetch('https://hacker-news.firebaseio.com/v0/beststories.json');
  ids = ids.concat(await body.json());
  ids = new Set(ids);
  console.log(`ids length = ${ids.length}`);
  let posts = [];
  for(let id of ids) {
    try {
      let post = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      post = await post.json();
      posts.push(post);
    } catch(e) {
      console.error(e);
    }
  }
  await batchSave(posts);
}

if (require.main === module) {
  (async function() {
    try {
      await save_posts();
    } catch(e) {
      console.log(e);
    }
  })();
}

// https://stackoverflow.com/a/26230409/2163429
function partition(array, n) {
  return array.length ? [array.splice(0, n)].concat(partition(array, n)) : [];
}
