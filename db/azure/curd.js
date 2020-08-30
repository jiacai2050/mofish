const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const v2ex = require('./../../actions/v2ex/fetch');
const hn = require('./../../actions/hacker-news/fetch');

const url = process.env.COSMOS_CONNECTION_URI ||  'mongodb://localhost:27017';

// Database Name
const dbName = 'hotposts';
const V2EX_TABLE_NAME = 'v2ex';
const HN_TABLE_NAME = 'hackernews';
// Create a new MongoClient

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
    let v2ex_posts = await v2ex.fetch_posts();
    let hn_posts = await hn.fetch_posts();
    await save_posts(v2ex_posts, hn_posts);
  })();
}
