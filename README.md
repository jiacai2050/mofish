# V2EX 热帖收藏夹

[![newsletter](https://github.com/jiacai2050/v2ex/workflows/newsletter/badge.svg)](https://github.com/jiacai2050/v2ex/actions?query=workflow%3Anewsletter) [![v2ex-fetch](https://github.com/jiacai2050/v2ex/workflows/v2ex-fetch/badge.svg)](https://github.com/jiacai2050/v2ex/actions?query=workflow%3Av2ex-fetch)
[![hackernews-fetch](https://github.com/jiacai2050/v2ex/workflows/hackernews-fetch/badge.svg)](https://github.com/jiacai2050/v2ex/actions?query=workflow%3Ahackernews-fetch)

本项目定期采集 V2EX/HackerNews 站点的热帖，在线浏览地址：

- https://github.com/jiacai2050/v2ex/labels/posts
- 历史数据（2022-08-20 前）可在这里查看
  - https://groups.google.com/g/v2ex_hot_posts
  - <del>https://groups.io/g/v2ex/topics （支持 RSS ）</del>

## 数据源

定期抓取
- https://www.v2ex.com/api/topics/hot.json

## 注意⚠️

为了防止重复抓取，需要将 v2ex 表的 url 字段设为唯一索引

## LeanCloud 相关文档

* [云函数开发指南](https://leancloud.cn/docs/leanengine_cloudfunction_guide-node.html)
* [网站托管开发指南](https://leancloud.cn/docs/leanengine_webhosting_guide-node.html)
* [JavaScript 开发指南](https://leancloud.cn/docs/leanstorage_guide-js.html)
* [JavaScript SDK API](https://leancloud.github.io/javascript-sdk/docs/)
* [Node.js SDK API](https://github.com/leancloud/leanengine-node-sdk/blob/master/API.md)
* [命令行工具使用指南](https://leancloud.cn/docs/leanengine_cli.html)
* [云引擎常见问题和解答](https://leancloud.cn/docs/leanengine_faq.html)
