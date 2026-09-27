---
title: 这个博客是怎么搭的
description: 从零到上线，这个博客的技术选型、目录结构、构建流程和踩过的坑。
publishedAt: 2026-09-27
locale: zh-cn
tags: [技术栈, 运维, Astro]
featured: true
---

这个站是静态生成的，没有数据库，没有后端进程。文章用 Markdown 写，构建时编译成 HTML，直接交给 OpenResty 托管。

整体链路很短：

```
本地写 Markdown
      ↓ git push
GitHub（源码唯一真相）
      ↓ 服务器 git clone / pull
ECS  npm ci && npm run build
      ↓ dist/ 纯静态产物
1Panel 站点目录 → OpenResty → 浏览器
```

## 技术选型

| 层 | 选型 | 说明 |
|---|---|---|
| 生成器 | Astro 7.2.4 | 输出纯静态 HTML，零运行时 |
| 主题 | astro-fourfold | 内容集合 + schema 校验 |
| 样式 | 原生 CSS | 三个文件，设计 token 用 CSS 变量 |
| 代码高亮 | Shiki | 构建期高亮，无客户端 JS |
| 托管 | 1Panel + OpenResty | Nginx 容器，bind mount 站点目录 |
| 服务器 | 阿里云 ECS | Alibaba Cloud Linux 3，2 核 2G |

选 Astro 的主要原因：**内容是文章，不是应用**。文章不需要 SSR、不需要数据库，也不需要 React。构建完就是一堆 HTML 文件，扔哪都能跑，迁移成本几乎为零。

## 内容模型

主题用 Astro 5 引入的 Content Layer 定义内容集合，每个集合一份 schema：

```ts
// src/content.config.ts
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    locale: z.enum(['zh-cn', 'en']).default('zh-cn'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

schema 是强制的。少写 `description`、日期格式不对，都会在构建期直接报错，而不是等到线上才发现。

## 构建流程

`npm run build` 实际上是三道关，任何一道过不去就不会产出：

```bash
npm run validate:content   # 1. 内容校验
npx astro check            # 2. 类型检查
npx astro build            # 3. 静态生成
```

第一道是我最看重的。它会检查必填字段缺失、公开路径重复、标签 slug 冲突：

```js
// 检查 URL 撞车
const paths = new Set();
function addPath(entry, url) {
  if (paths.has(url)) errors.push(`duplicate public path ${url}`);
  paths.add(url);
}
```

两篇同名文章落在同一个 URL 上，搜索引擎只会收录一个，另一篇永远访问不到。这种错误肉眼很难发现，交给脚本更靠谱。

## URL 设计

文章 URL 从 `publishedAt` 推导，不允许手动指定：

```
/writing/2026/09/hello-world/
         └──┬──┘ └──┬───┘ └───┬──┘
          年      月      slug
```

带上年月的好处是文章天然按时间归档，`/writing/2026/` 直接就是 2026 年的全部文章，不需要额外的分类逻辑。

slug 建议用拼音或英文，中文文件名也能跑，但分享出去的链接带中文各大平台转义处理不一致，容易出现看起来一样实际不同的两个 URL。

## 部署

编译在服务器上完成，产物用文件系统 rename 换进去：

```bash
SITE=/opt/1panel/www/sites/www.nbbnbb.com.cn
mv $SITE/index $SITE/index.bak          # 旧版本留档
mv /opt/blog-work/blog/dist $SITE/index # 新版本就位
```

`dist/` 和站点目录在同一个文件系统上，`mv` 是原子的 rename，不是逐个文件复制。nginx 配置完全不用动，静态文件放进去就生效，不用重启。

## 踩过的坑

### 1. 依赖不能写 latest

主题原版 `package.json` 里全是 `"latest"`。这意味着任何人跑一次 `npm install` 都会拉到最新版本——包括可能刚发布、要求更高 Node 版本的破坏性更新。

Astro 7 要求 Node ≥ 22.12，而服务器上装的 Node 需要跟着升。锁定版本之后，构建才是可复现的：

```json
{
  "dependencies": {
    "astro": "7.2.4",
    "@astrojs/rss": "4.0.19"
  }
}
```

配合 `npm ci` 严格按 lockfile 安装，绝不会意外升级。

### 2. 环境变量有两套机制

`astro.config.mjs` 读 `process.env`，组件里读 `import.meta.env`。只在一处设置，另一处就是空值，结果是 RSS 和 sitemap 里全是 `https://example.org`。

两处都要设，或者都放进 `.env`：

```bash
SITE_URL=https://www.nbbnbb.com.cn BASE_PATH=/ npm run build
```

### 3. 类型检查挡下了一次线上事故

改配置文件时漏掉了一个字段，三个文件引用它。`astro check` 立刻报 3 个错误，构建中断。

这正是保留这道关的意义——静态站的类型错误不会在运行时炸，但会让 SEO 元数据悄悄变成错的。构建期拦住，比上线后用搜索引擎收录了一堆坏页面再回头修便宜得多。

## 还没做的

- 全文搜索目前是浏览器端 `includes` 匹配，文章多了会不准，需要的话换 Pagefind 或 MiniSearch
- 没有评论系统
- 部署靠手动 `git pull && npm run build`，没上 CI

> 内容以 CC BY-NC-SA 4.0 授权。
