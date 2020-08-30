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

  if (hn_posts.length > 0) {
    const collection = db.collection(HN_TABLE_NAME);
    try {
      const ret = await collection.insertMany(hn_posts);
      console.log(ret);
    } catch(e) {
      console.error(e);
    }
  }

  client.close();

}

if(require.main === module) {
  (async () => {
    switch(argv.action) {
    case "index":
      await index_posts();
      break;
    default:
      let v2ex_posts = await v2ex.fetch_posts();
      let hn_posts = await hn.fetch_posts();
      await save_posts(v2ex_posts, hn_posts);
    }
  })();
}
