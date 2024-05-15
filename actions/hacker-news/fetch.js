require('../../dep');
const { Object } = require('leancloud-storage');
const { POST_TABLE_NAME } = require('./common')

const Table = Object.extend(POST_TABLE_NAME);

async function batch_save(posts) {
  for (const post of posts) {
    try {
      let table = new Table();
      table.set(post);
      let ret = await table.save(null, {fetchWhenSave: true });
      console.log(`id=${ret.get('id')}, title=${ret.get('title')}`);
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

  let total_ids = top_ids.concat(best_ids);
  total_ids = new Set(total_ids);
  console.log(`ids length = ${total_ids.size}`);
  let posts = [];
  for(let id of total_ids) {
    try {
      let post = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      post = await post.json();
      const score = post.score;
      if (score > 100) {
        posts.push(post);
      }
    } catch(e) {
      console.error(e);
    }
  }
  console.log(`ids length after filter = ${posts.length}`);
  return posts;
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
