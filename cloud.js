const { Cloud } = require('leanengine');
const {save_online, save_posts} = require('./actions/v2ex/fetch');

Cloud.define('v2ex', (req) => {
  save_posts();
});

Cloud.define('online_num', (req) => {
  save_online();
});
