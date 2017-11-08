'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var AV = require('leanengine');
var moment = require('moment');
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

app.get('/', function(req, res) {
  res.render('index', { current_day: moment().format('YYYYMMDD') });
});
app.get('/:current_day', function(req, res) {
  res.render('index', { current_day: req.params['current_day'] });
});

module.exports = app;
