require('../../init-lc');
const { Object } = require('leanengine');
const fetch = require('node-fetch');
const { POST_TABLE_NAME } = require('./common')

const Table = Object.extend(POST_TABLE_NAME);

async function batch_save(posts) {
  for (let batch of partition(posts, 200)) {
    let posts = batch.map((post) => {
      let table = new Table();
      table.set(post);
      return table;
    });
    try {
      let ret = await Object.saveAll(posts);
      console.log(ret);
    } catch(e) {
      console.error(`code = ${e.code}, message = ${e.message}`);
    }
  }
}

async function fetch_posts() {
  let top_ids = [];
  try {
    let body = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    top_ids = await body.json();
  } catch(e) {
    console.error(e);
  }
  let best_ids = [];
  try {
    let body = await fetch('https://hacker-news.firebaseio.com/v0/beststories.json');
    best_ids = await body.json();
  } catch(e) {
    console.error(e);
  }

  // let top_ids = [24304275];
  // let best_ids = [24303322, 24303779];

  let total_ids = top_ids.concat(best_ids);
  total_ids = new Set(total_ids);
  console.log(`ids length = ${total_ids.size}`);
  let posts = [];
  for(let id of total_ids) {
    try {
      let post = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      post = await post.json();
      posts.push(post);
    } catch(e) {
      console.error(e);
    }
  }
}

async function save_posts() {
    await batch_save(await fetch_posts());
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

module.exports = { fetch_posts };
