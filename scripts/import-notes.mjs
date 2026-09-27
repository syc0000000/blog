// 一次性迁移脚本：把 syc0000000/notes 的 Obsidian 笔记转成 astro-fourfold 的 writing 集合
// 保留原始 creat/mod 日期，文件名转拼音 slug
// 用法：node scripts/import-notes.mjs /path/to/notes
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

// 人工确认的 文件名 -> 拼音 slug 映射。slug 一旦发布即成为永久 URL，不要随意改。
const SLUGS = {
  '注解': 'zhu-jie',
  'DDIA阅读笔记 - 数据系统基础概述': 'ddia-yuedu-biji-shujuxitong-jichu-gaishu',
  'Java 面经': 'java-mianjing',
  'Java集合框架解析': 'java-jihe-kuangjia-jiexi',
  'JVM面经': 'jvm-mianjing',
  'MySQL性能调优': 'mysql-xingneng-tiaoyou',
  'MySQL索引失效常见原因分析': 'mysql-suoyin-shixiao-changjian-yuanyin-fenxi',
  'Redis 事务 Lua 与 ACID 特性': 'redis-shiwu-lua-yu-acid-texing',
  'Redis集群': 'redis-jiqun',
  'Redis面经': 'redis-mianjing',
  'Spring AOP核心概念与实现流程': 'spring-aop-hexin-gainian-yu-shixian-liucheng',
  'Spring Security面经': 'spring-security-mianjing',
  'SpringBoot面经——SpringBean部分': 'springboot-mianjing-springbean-bufen',
  'Zookeeper与分布式理论': 'zookeeper-yu-fenbushililun',
  '数据库面经': 'shujuku-mianjing',
  'RBAC权限管理': 'rbac-quanxian-guanli',
  '简单公告': 'jiandan-gonggao',
  '邮箱验证码': 'youxiang-yanzhengma',
  '雪花ID': 'xuehua-id',
  'WSL 无法配置 networkingMode Mirrored': 'wsl-wufa-peizhi-networkingmode-mirrored',
  'FSR的奇怪题目': 'fsr-de-qiguai-timu',
  '两数之和': 'liangshu-zhihe',
  '刷算法计划': 'shua-suanfa-jihua',
  '反转链表': 'fanzhuan-lianbiao',
  '搜索插入位置': 'sousuo-charu-weizhi',
  '有效的字母异位词': 'youxiao-de-zimu-yiweici',
  '螺旋矩阵': 'luoxuan-juzhen',
  '长度最小子数组': 'changdu-zuixiao-zishuzu',
  'VSCode 启用 Pretty Printing For GDB 以调试 vector 等 STL 容器': 'vscode-qiyong-pretty-printing-debug-vector-stl',
  '二分查找': 'erfen-chazhao',
  '二叉树': 'ercha-shu',
  '分治算法': 'fenzhi-suanfa',
  '前缀和': 'qianzhu-he',
  '动态规划': 'dongtai-guihua',
  '双指针（移除元素）': 'shuangzhizhen-yichu-yuansu',
  '哈希表': 'hashi-biao',
  '基础速通': 'jichu-sutong',
  '堆基础解析及操作': 'dui-jichu-jiexi-ji-caozuo',
  '栈与队列': 'zhan-yu-duilie',
  '滑动窗口': 'huadong-chuangkou',
};

// 目录 -> 标签。没写 tags 的笔记靠这个兜底。
const DIR_TAGS = {
  '后端/Java': ['后端', 'Java'],
  '后端/技术栈': ['后端'],
  '后端/招新平台设计': ['后端', '招新平台设计'],
  '杂七杂八': [],
  '算法/刷题记录': ['算法', '题目'],
  '算法/基础知识': ['算法', '数据结构'],
};

const notesRoot = process.argv[2];
if (!notesRoot) { console.error('用法: node scripts/import-notes.mjs <notes 仓库路径>'); process.exit(1); }
const vaultDir = path.join(notesRoot, '笔记');
const outDir = path.join(process.cwd(), 'src', 'content', 'writing');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) files.push(p);
  }
})(vaultDir);

const manifest = [];
const errors = [];
const usedSlugs = new Set();

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(vaultDir, file);
  const base = path.basename(file, '.md');
  const dir = path.dirname(rel).split(path.sep).join('/');

  const slug = SLUGS[base];
  if (!slug) { errors.push(`缺少 slug 映射: ${rel}`); continue; }
  if (usedSlugs.has(slug)) { errors.push(`slug 冲突: ${slug} (${rel})`); continue; }
  usedSlugs.add(slug);

  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm = m ? (parse(m[1]) ?? {}) : {};
  const body = m ? raw.slice(m[0].length) : raw;

  const title = fm.title || base;
  const created = fm.creat || fm.date;
  if (!created) { errors.push(`缺少日期: ${rel}`); continue; }
  const published = new Date(created);

  const fmTags = Array.isArray(fm.tags) ? fm.tags : [];
  const dirTags = DIR_TAGS[dir] ?? [];
  const tags = [...new Set([...fmTags, ...dirTags])];

  // description：取正文第一段有意义的文字。
  // 规则：跳过标题/列表/引用/图片；取第一段 >=12 字的正文；
  // 结尾按标点或字数截断，避免半句话。
  const stripInline = (t) => t
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/^\s*[·\-—]\s*/, '')
    .trim();
  const firstPara = body
    .split(/\n\s*\n/)
    .map((p) => stripInline(p).replace(/\n+/g, ' '))
    .find((p) => p.replace(/\s/g, '').length >= 20 && !/^[#\-\*\s]*$/.test(p));
  let description = fm.description || firstPara || `${title} —— 来自个人笔记库。`;
  description = description.replace(/\s+/g, ' ').trim();
  if (description.length > 100) {
    const cut = description.slice(0, 100);
    // 优先在最后一个句读处断开
    const m2 = cut.match(/^(.*[。！？；，、])/);
    description = (m2 ? m2[1] : cut.replace(/[\s,，、]*\S{0,12}$/, '')) + '…';
  }
  // 去掉结尾孤立的标点
  description = description.replace(/[：:，,、。]+$/, '') + (/[。！？]$/.test(description) ? '' : '');

  // 中文按 ~400 字/分钟估算阅读时长
  const minutes = Math.max(1, Math.round((body.replace(/\s/g, '').length) / 400));

  const out = {
    title,
    description,
    publishedAt: published.toISOString().slice(0, 10),
    locale: 'zh-cn',
    tags,
    minutes,
  };
  if (fm.mod && fm.mod !== fm.creat) {
    const mod = new Date(fm.mod);
    if (mod > published) out.updatedAt = mod.toISOString().slice(0, 10);
  }

  // YAML 序列化：含特殊字符的字段强制加引号
  const q = (v) => /[:#\[\]{}&*!|>'"%@`,]|^[\s-]|\s$|：/.test(String(v))
    ? `'${String(v).replace(/'/g, "''")}'` : String(v);
  const yamlStr = [
    '---',
    `title: ${q(title)}`,
    `description: ${q(description)}`,
    `publishedAt: ${out.publishedAt}`,
    ...(out.updatedAt ? [`updatedAt: ${out.updatedAt}`] : []),
    'locale: zh-cn',
    `tags: [${tags.map(q).join(', ')}]`,
    `minutes: ${minutes}`,
    '---',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, `${slug}.md`), yamlStr + body.replace(/^\n+/, ''), 'utf8');
  manifest.push({ title, slug, date: out.publishedAt, tags, rel });
}

if (errors.length) {
  console.error('迁移中止：');
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

console.log(`转换完成: ${manifest.length} 篇 -> ${outDir}`);
fs.writeFileSync(path.join(process.cwd(), 'import-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('清单已写入 import-manifest.json');
