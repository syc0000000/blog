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

## AI 自动补 description

有些文章正文开头就是代码块或者内容极短，自动提取的摘要质量不行。可以用 AI 补一版。

走任意 OpenAI 兼容接口（`/v1/chat/completions`），换服务商只改配置。

### 配置

两种方式，优先级：环境变量 > `ai.config.json`。

```bash
# 方式一：环境变量（推荐，Key 不落盘）
export AI_BASE_URL=https://api.deepseek.com/v1
export AI_API_KEY=sk-xxxx
export AI_MODEL=deepseek-chat
```

```bash
# 方式二：配置文件（ai.config.json 已在 .gitignore 里）
cp ai.config.example.json ai.config.json
# 编辑 ai.config.json 填入 baseUrl / model / apiKey
```

### 使用

```bash
npm run ai:check              # 只体检，列出过短的文章，不调 API
npm run ai:descriptions       # 补全缺失或过短（<25 字）的描述
npm run ai:descriptions:dry   # 试跑，只打印不写文件
npm run ai:descriptions:all   # 重写全部（谨慎，会覆盖手写内容）
node scripts/ai-descriptions.mjs --force <slug>   # 强制重写指定文章
```

生成结果直接写回 Markdown 的 frontmatter，是**静态文本**，不是构建时动态生成。
所以生成完还要重新构建部署才生效。

默认只处理缺失或短于 `minLength`（25）字的描述，手写内容不会被覆盖。
想调整阈值改 `ai.config.json` 的 `minLength`，或设环境变量 `AI_MIN_LENGTH`。

### 构建时的提醒

`npm run build` 的内容校验会检查所有 description 长度，过短的会打印警告（不阻断构建）：

```
Descriptions shorter than 25 chars (3):
- 16 chars: 刷算法计划
- 20 chars: Java集合框架解析
  Run `npm run ai:descriptions` to fill them with AI.
```

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
