const marked = require("marked");
const { JSDOM } = require("jsdom");

/**
 * 将 Markdown 转换为 Telegraph 格式
 * @param {string} markdown - Markdown 文本
 * @returns {Array} Telegraph 格式的内容数组
 */
function markdownToTelegraph(markdown) {
  // 使用 marked 将 Markdown 转为 HTML
  const html = marked.parse(markdown);

  // 使用 JSDOM 解析 HTML
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const body = document.body;

  // 转换 DOM 为 Telegraph Node 格式
  const content = [];
  for (let i = 0; i < body.childNodes.length; i++) {
    const node = domToNode(body.childNodes[i]);
    if (node) {
      content.push(node);
    }
  }

  return content;
}

/**
 * 将 DOM 节点转换为 Telegraph Node
 * @param {Node} domNode - DOM 节点
 * @returns {string|Object|null} Telegraph Node
 */
function domToNode(domNode) {
  // 文本节点
  if (domNode.nodeType === 3) {
    // TEXT_NODE
    const text = domNode.data.trim();
    return text ? text : null;
  }

  // 元素节点
  if (domNode.nodeType === 1) {
    // ELEMENT_NODE
    const tag = domNode.tagName.toLowerCase();

    // Telegraph 支持的标签
    const allowedTags = [
      "a",
      "aside",
      "b",
      "blockquote",
      "br",
      "code",
      "em",
      "figcaption",
      "figure",
      "h3",
      "h4",
      "hr",
      "i",
      "iframe",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "s",
      "strong",
      "u",
      "ul",
      "video",
    ];

    // 标签映射（将不支持的标签映射到支持的标签）
    const tagMapping = {
      h1: "h3",
      h2: "h3",
      h5: "h4",
      h6: "h4",
      del: "s",
      strike: "s",
    };

    let finalTag = tagMapping[tag] || tag;

    // 如果标签不被支持，尝试提取其子节点
    if (!allowedTags.includes(finalTag)) {
      if (domNode.childNodes.length > 0) {
        const children = [];
        for (let i = 0; i < domNode.childNodes.length; i++) {
          const child = domToNode(domNode.childNodes[i]);
          if (child) {
            children.push(child);
          }
        }
        // 如果只有一个子节点，直接返回
        if (children.length === 1) {
          return children[0];
        }
        // 多个子节点，包装在段落中
        if (children.length > 0) {
          return { tag: "p", children };
        }
      }
      return null;
    }

    const nodeElement = { tag: finalTag };

    // 处理属性（只支持 href 和 src）
    if (domNode.attributes && domNode.attributes.length > 0) {
      for (let i = 0; i < domNode.attributes.length; i++) {
        const attr = domNode.attributes[i];
        if (attr.name === "href" || attr.name === "src") {
          if (!nodeElement.attrs) {
            nodeElement.attrs = {};
          }
          nodeElement.attrs[attr.name] = attr.value;
        }
      }
    }

    // 处理子节点
    if (domNode.childNodes.length > 0) {
      nodeElement.children = [];
      for (let i = 0; i < domNode.childNodes.length; i++) {
        const child = domToNode(domNode.childNodes[i]);
        if (child) {
          nodeElement.children.push(child);
        }
      }

      // 如果没有有效的子节点，删除 children 属性
      if (nodeElement.children.length === 0) {
        delete nodeElement.children;
      }
    }

    return nodeElement;
  }

  return null;
}

/**
 * 创建 Telegraph 页面
 * @param {string} accessToken - Telegraph 访问令牌
 * @param {string} title - 页面标题
 * @param {string} markdown - Markdown 内容
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} Telegraph API 响应
 */
async function createTelegraphPage(accessToken, title, markdown, options = {}) {
  const content = markdownToTelegraph(markdown);

  const params = new URLSearchParams({
    access_token: accessToken,
    title: title,
    content: JSON.stringify(content),
    return_content: options.returnContent || false,
  });

  if (options.authorName) {
    params.append("author_name", options.authorName);
  }

  if (options.authorUrl) {
    params.append("author_url", options.authorUrl);
  }

  const response = await fetch("https://api.telegra.ph/createPage", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Create Telegraph page failed: ${await response.text()}`);
  }

  return await response.json();
}

// 导出函数
module.exports = {
  markdownToTelegraph,
  createTelegraphPage,
  domToNode,
};

// ========== 如果直接运行此文件，执行示例 ==========
if (require.main === module) {
  const exampleMarkdown = `
# 这是标题

这是一个段落，包含 **粗体** 和 *斜体* 文字。

## 列表示例

- 项目 1
- 项目 2
- 项目 3

### 代码示例

\`\`\`javascript
console.log('Hello, Telegraph!');
\`\`\`

[这是一个链接](https://example.com)

> 这是一个引用块

![图片](https://example.com/image.jpg)
`;

  // 转换示例
  const content = markdownToTelegraph(exampleMarkdown);
  console.log("转换结果：");
  console.log(JSON.stringify(content, null, 2));

  // 创建页面示例（需要有效的 access_token）
  // createTelegraphPage('YOUR_ACCESS_TOKEN', '测试文章', exampleMarkdown, {
  //   authorName: 'Anonymous',
  //   returnContent: true
  // }).then(result => {
  //   console.log('创建成功:', result);
  // }).catch(err => {
  //   console.error('创建失败:', err);
  // });
}
