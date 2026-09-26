---
title: Hello World
description: astro-fourfold 已部署到 www.nbbnbb.com.cn，这是第一篇文章。
publishedAt: 2026-09-27
locale: zh-cn
tags: [公告]
featured: true
---

站点已经换新家了。这里由 [astro-fourfold](https://github.com/Liyuk/astro-fourfold) 驱动——一个静态优先的 Astro 个人出版物主题。

## 为什么是这个主题

它把内容分成几类：写作（writing）、项目（projects）、研究（research）等，页面由 Markdown 和 schema 派生，不用手写。

- **写作**按时间沉淀，带标签、目录、上下篇
- **项目**有状态字段，适合放长期维护的东西
- **标签**提供跨年份的横向索引

## 部署结构

源码在 GitHub，编译产物落在服务器：

```bash
# 服务器上
git clone git@github.com:syc0000000/blog.git
npm ci
npm run build
```

构建产物是纯静态 HTML，直接由 OpenResty 托管。

## 接下来

1. 把 Obsidian 笔记里的文章逐步搬进来
2. 需要的话再加评论、订阅之类的能力

> 主题本身不绑定任何作者身份和后端，保持静态优先。

