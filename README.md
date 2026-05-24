# mofish

[![newsletter](https://github.com/jiacai2050/mofish/actions/workflows/newsletter.yml/badge.svg)](https://github.com/jiacai2050/mofish/actions/workflows/newsletter.yml) [![v2ex-fetch](https://github.com/jiacai2050/mofish/actions/workflows/v2ex-fetch.yml/badge.svg)](https://github.com/jiacai2050/mofish/actions/workflows/v2ex-fetch.yml)
[![hackernews-fetch](https://github.com/jiacai2050/mofish/actions/workflows/hackernews-fetch.yml/badge.svg)](https://github.com/jiacai2050/mofish/actions/workflows/hackernews-fetch.yml)
[![pages](https://github.com/jiacai2050/mofish/actions/workflows/pages.yml/badge.svg)](https://github.com/jiacai2050/mofish/actions/workflows/pages.yml)

> 了解社区最新动态，掌握摸鱼最佳姿势。

## 介绍

mofish 是一个收集和整理互联网社区热门帖子的项目，旨在帮助用户快速了解各大社区的最新动态和热门话题。通过自动化脚本定期抓取 V2EX 和 Hacker News 等社区的热门帖子，并将其整理成易于阅读的格式，方便用户浏览和获取信息。

## 功能

- 定期抓取 V2EX 和 Hacker News 的热门帖子。
- 热帖支持 AI 总结，帮助用户快速了解帖子的核心内容。
- 支持多种订阅方式，包括 [GitHub issues](https://github.com/jiacai2050/mofish/labels/posts)、[Telegram](https://t.me/+XVM4rZ_fH5xkZjhl)、[Discord](https://discord.gg/AuvBvp5zgJ) 和 [Google Groups](https://groups.google.com/g/mo-fish)。

## 网站

在线浏览：http://news.liujiacai.net

- 首页按月归档，每天展示 top1 热帖标题
- 点击日期查看当天所有热帖及 AI 摘要
- 支持 [RSS 订阅](http://news.liujiacai.net/feed.xml)

## 数据源

- https://hacker-news.firebaseio.com/v0/topstories.json
- https://hacker-news.firebaseio.com/v0/beststories.json
- https://www.v2ex.com/api/topics/hot.json

## License

[MIT](./LICENSE)
