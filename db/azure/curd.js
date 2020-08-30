const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const v2ex = require('./../../actions/v2ex/fetch');
const hn = require('./../../actions/hacker-news/fetch');
const {argv} = require('yargs')

const url = process.env.COSMOS_CONNECTION_URI ||  'mongodb://localhost:27017';

// Database Name
const dbName = 'hotposts';
const V2EX_TABLE_NAME = 'v2ex';
const HN_TABLE_NAME = 'hackernews';

async function index_posts() {
  const client = new MongoClient(url);
  await client.connect()
  const db = client.db(dbName);
  try {
    const v2ex = db.collection(V2EX_TABLE_NAME);
    const ret = await v2ex.createIndex({id: 1}, {background: true, unique: true});
    console.log(ret);
  } catch(e) {
    console.log(e);
  }
  try {
    const hn = db.collection(HN_TABLE_NAME);
    const ret =   await hn.createIndex({id: 1}, {background: true, unique: true});
    console.log(ret);
  } catch(e) {
    console.log(e);
  }
  client.close();
}

async function save_posts(v2ex_posts, hn_posts) {
  v2ex_posts = v2ex_posts || [];
  hn_posts = hn_posts || [];

  const client = new MongoClient(url);
  await client.connect()
  console.log("Connected successfully to server");

  const db = client.db(dbName);

  if (v2ex_posts.length > 0) {
    const collection = db.collection(V2EX_TABLE_NAME);
    try {
      const ret = await collection.insertMany(v2ex_posts);
      console.log(ret);
    } catch(e) {
      console.error(e);
    }
  }

  await sleep(3000);

  if (hn_posts.length > 0) {
    const collection = db.collection(HN_TABLE_NAME);
    for(let batch of partition(hn_posts, 50)) {
      try {
        const ret = await collection.insertMany(batch);
        console.log(ret);
      } catch(e) {
        console.error(e);
      } finally {
        await sleep(5000);
      }
    }
  }

  client.close();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

if(require.main === module) {
  (async () => {
    switch(argv.action) {
    case "index":
      await index_posts();
      break;
    case "sleep":
      console.log(new Date());
      await sleep(5000);
      console.log(new Date());
      break;
    default:
      let v2ex_posts = await v2ex.fetch_posts();
      let hn_posts = await hn.fetch_posts();
      await save_posts(v2ex_posts, hn_posts);
    }
  })();
}


// https://stackoverflow.com/a/26230409/2163429
function partition(array, n) {
  return array.length ? [array.splice(0, n)].concat(partition(array, n)) : [];
}
