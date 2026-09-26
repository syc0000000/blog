# NBB's Blog

个人博客，源码在 GitHub，编译产物部署在阿里云 ECS 的 1Panel 站点目录。

- 线上地址：https://www.nbbnbb.com.cn
- 技术栈：[Astro](https://astro.build) 7 + 主题 [astro-fourfold](https://github.com/Liyuk/astro-fourfold)
- 内容：写作（writing）、项目（projects）、研究（research）、专栏（columns）、影像（photos）、友链（links）
- 授权：CC BY-NC-SA 4.0

## 本地开发

```bash
cp .env.example .env    # 可选，默认值就是线上域名
npm ci
npm run dev
```

## 内容怎么写

文章放在 `src/content/<集合名>/`，frontmatter 由 `src/content.config.ts` 的 schema 校验。

最小可用的写作文章：

```yaml
---
title: 文章标题
description: 一句话摘要，会显示在列表页和 RSS 里。
publishedAt: 2026-09-27
locale: zh-cn
tags: [后端]
---
```

`writing` 集合还支持 `updatedAt`、`featured`（首页精选）、`column`（归入某个专栏）。

写完先自检：

```bash
npm run check     # 校验 frontmatter + 类型检查
```

## 部署

服务器上（源码在 GitHub，编译在服务器）：

```bash
git clone git@github.com:syc0000000/blog.git
cd blog
npm ci
SITE_URL=https://www.nbbnbb.com.cn BASE_PATH=/ npm run build
```

`dist/` 就是纯静态产物，交给 OpenResty 托管。当前站点目录：

```
/opt/1panel/www/sites/www.nbbnbb.com.cn/index
```

构建产物直接覆盖该目录即可生效，不需要重启 OpenResty。

## 依赖版本已锁定

`package.json` 里所有依赖都写的是确切版本号（不是 `^` / `latest`），构建用的 Astro 版本固定为 **7.2.4**。

> 注意：Astro 7 要求 **Node >= 22.12.0**。服务器上装的是 Node 22.23.3。
> 升级依赖时改版本号后要同步更新 `package-lock.json`。

## 目录

```
src/
  content/            文章内容（各集合一个子目录）
  data/site.ts        站点名称、作者、社交链接、许可证
  data/navigation.ts  顶部导航
  lib/content.ts      内容查询与 URL 生成
  pages/              路由页面
scripts/validate-content.mjs   内容校验（构建第一步）
```
