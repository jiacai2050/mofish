const ejs = require('ejs');
const fs = require('fs');
const { Console } = require('console');
const hn = require('./hacker-news/mail');
const v2ex = require('./v2ex/mail');
const juice = require('juice');
const moment = require('moment');

if (require.main === module) {
  const file_opts = {'encoding': 'utf8', 'flags': 'w'};
  const git_sha = process.env.GIT_SHA || 'master';

  const myArgs = process.argv.slice(2);
  const output = myArgs[0] || 'result.html';
  const file_console = new Console(fs.createWriteStream(output, file_opts));

  (async () => {
    let hn_posts = await hn.fetch_post();
    let v2ex_posts = await v2ex.fetch_post();
    let yesterday = moment().add(-1, 'd').startOf('day');

    let tmpl = fs.readFileSync(`${__dirname}/../public/mail.ejs`, file_opts);
    let body = ejs.render(tmpl, {
      hn_posts: hn_posts,
      v2ex_posts: v2ex_posts,
      git_sha: git_sha,
      data_time: yesterday.format('YYYY-MM-DD')
    }, {views: [`${__dirname}/../public`]});
    file_console.log(juice(body));
  })()
}
