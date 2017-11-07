# V2EX 热帖收藏夹

本项目主要使用 [LeanCloud](https://leancloud.cn/) 存储与云引擎实现，浏览地址：

> http://v2ex.leanapp.cn/

## 主要功能

- 两个定时云函数收集数据，具体见 [cloud.js](./cloud.js)
- 按天展示热帖

## 注意⚠️

为了防止重复抓取，需要将 v2ex 表的 id 字段设为唯一索引

## 相关文档

* [云函数开发指南](https://leancloud.cn/docs/leanengine_cloudfunction_guide-node.html)
* [网站托管开发指南](https://leancloud.cn/docs/leanengine_webhosting_guide-node.html)
* [JavaScript 开发指南](https://leancloud.cn/docs/leanstorage_guide-js.html)
* [JavaScript SDK API](https://leancloud.github.io/javascript-sdk/docs/)
* [Node.js SDK API](https://github.com/leancloud/leanengine-node-sdk/blob/master/API.md)
* [命令行工具使用指南](https://leancloud.cn/docs/leanengine_cli.html)
* [云引擎常见问题和解答](https://leancloud.cn/docs/leanengine_faq.html)
