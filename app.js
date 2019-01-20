'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var AV = require('leanengine');
var storage = require('leancloud-storage');
var moment = require('moment');
var RSS = require('rss');
// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
app.use(AV.Cloud.HttpsRedirect());

var render_params = {
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
};
app.get('/', function(req, res) {
    res.render('index', Object.assign(render_params, { current_day: moment().add(-1, 'd').format('YYYYMMDD') }));
});

var feed = new RSS({
    title: "V2EX Hot Posts",
    feed_url: '/feed',
    ttl: 60 * 60 * 6, // 6 hours
});
var feed_cache = '';
let q = new storage.Query('v2ex');
q.limit(1000);
q.descending('createdAt');

app.get('/feed', function(req, res) {
    res.type('application/xml');
    if (feed_cache == '' || moment().hour() < 3 || req.query.refresh) {
        var num_item = 0;
        q.find().then(function(results) {
            console.log('update feed xml');
            for(let post of results) {
                feed.item({
                    title: `[${post.get('node')['title']}][${moment(post.get('created') * 1000).format('YYYYMMDD')}] ${post.get('title')}`,
                    description: post.get('content_rendered'),
                    url: post.get('url'),
                    date: post.get('last_modified') * 1000,
                    categories: [post.get('node')['title']]
                });
                num_item ++;
                if(num_item > 3100) {
                    break; // avoid inoreader.com's block 
                }
            }
            feed_cache = feed.xml();
            res.send(feed_cache);
        }).catch(function(err) {
            console.error(err);
            feed_cache = '';
            res.send(feed.xml())
        });
    } else {
        res.send(feed_cache);
    }
});

app.get('/:current_day', function(req, res) {
    res.render('index', Object.assign(render_params, { current_day: req.params['current_day'] }));
});

module.exports = app;
