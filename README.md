# mofish

[![newsletter](https://github.com/jiacai2050/hot-posts/workflows/newsletter/badge.svg)](https://github.com/jiacai2050/hot-posts/actions?query=workflow%3Anewsletter) [![v2ex-fetch](https://github.com/jiacai2050/hot-posts/workflows/v2ex-fetch/badge.svg)](https://github.com/jiacai2050/hot-posts/actions?query=workflow%3Av2ex-fetch)
[![hackernews-fetch](https://github.com/jiacai2050/mofish/workflows/hackernews-fetch/badge.svg)](https://github.com/jiacai2050/mofish/actions?query=workflow%3Ahackernews-fetch)

> 了解社区最新动态，掌握摸鱼最佳姿势。

本项目定期采集 V2EX/HackerNews 站点的热帖，在线浏览地址：

- https://github.com/jiacai2050/mofish/labels/posts
- https://t.me/mofish_break
- 历史数据（2022-08-20 前）可在这里查看
  - https://groups.google.com/g/mo-fish

## 数据源

定期抓取
- https://www.v2ex.com/api/topics/hot.json

## 注意⚠️

为了防止重复抓取，需要将 v2ex 表的 url 字段设为唯一索引
