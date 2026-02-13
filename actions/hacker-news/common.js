const POST_TABLE_NAME = "hackernews";

module.exports = { POST_TABLE_NAME, sleep };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
