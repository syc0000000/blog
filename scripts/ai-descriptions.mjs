// 用 AI 为 description 过短或缺失的文章生成摘要。
//
// 走任意 OpenAI 兼容接口（/v1/chat/completions），换服务商只改 ai.config.json。
// 生成结果写回 Markdown frontmatter，是静态文本，不是构建时动态生成。
//
// 用法：
//   node scripts/ai-descriptions.mjs            # 只处理缺失或过短的
//   node scripts/ai-descriptions.mjs --all      # 重写全部（谨慎）
//   node scripts/ai-descriptions.mjs --dry      # 只打印不写文件
//   node scripts/ai-descriptions.mjs --force <slug>   # 强制重写指定文章
//   node scripts/ai-descriptions.mjs --check    # 只体检，列出过短的文章，不调 API
import fs from 'node:fs';
import path from 'node:path';

// ---- 配置：优先级 环境变量 > ai.config.json > 内置默认 ----
function loadConfig() {
  let fileCfg = {};
  const cfgPath = path.join(process.cwd(), 'ai.config.json');
  if (fs.existsSync(cfgPath)) {
    try { fileCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); }
    catch (e) { console.error('ai.config.json 解析失败:', e.message); process.exit(1); }
  }
  const env = process.env;
  return {
    baseUrl: env.AI_BASE_URL || fileCfg.baseUrl || 'https://api.minimax.chat/v1',
    apiKey: env.AI_API_KEY || fileCfg.apiKey || '',
    model: env.AI_MODEL || fileCfg.model || 'MiniMax-M2.5',
    // 小于这个字数视为「过短」，需要 AI 补全
    minLength: Number(env.AI_MIN_LENGTH || fileCfg.minLength || 25),
    // 生成摘要的目标字数区间
    targetLength: fileCfg.targetLength || { min: 40, max: 90 },
    temperature: fileCfg.temperature ?? 0.3,
    timeoutMs: Number(fileCfg.timeoutMs || 60000),
    concurrency: Number(fileCfg.concurrency || 2),
  };
}

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const ALL = args.includes('--all');
const CHECK = args.includes('--check');
const FORCE = args.includes('--force') ? args[args.indexOf('--force') + 1] : null;

const cfg = loadConfig();
const contentDir = path.join(process.cwd(), 'src', 'content', 'writing');

// ---- 读一篇的 frontmatter / 正文 ----
function readArticle(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const body = raw.slice(m[0].length);
  // frontmatter 是我们自己生成的，结构固定，按行解析避免引入 yaml 依赖的转义问题
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, v] = kv;
    fm[k] = /^'.*'$/.test(v) ? v.slice(1, -1).replace(/''/g, "'") : v;
  }
  return { raw, fmBlock: m[1], body, fm, file };
}

function writeDescription(art, desc) {
  const newFmBlock = art.fmBlock.replace(/^description:.*$/m, `description: ${desc}`);
  fs.writeFileSync(art.file, `---\n${newFmBlock}\n---\n${art.body}`, 'utf8');
}

// ---- 调 AI ----
async function callAI(title, bodyText) {
  const prompt =
`你为一个中文技术博客写文章摘要。

要求：
1. 用 40-90 个汉字概括文章讲了什么，说清主题而不是罗列细节
2. 直接输出摘要本身，不要引号、标签、markdown 标记、前缀
3. 不要出现「本文」「这篇文章」「作者」等元叙述
4. 如果是面经类文章，说明覆盖了哪些核心考点
5. 只输出一段

文章标题：${title}

文章开头：
${bodyText}

摘要：`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        max_tokens: 300,
        messages: [
          { role: 'system', content: '你是中文技术博客的摘要撰写助手，只输出摘要正文。' },
          { role: 'user', content: prompt },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    let out = data?.choices?.[0]?.message?.content ?? '';
    // 去掉模型可能加的引号/前缀/思考标签
    out = out.replace(/<think>[\s\S]*?<\/think>/g, '')
             .replace(/^```[\s\S]*?\n|```$/g, '')
             .replace(/^(摘要|description)\s*[:：]\s*/i, '')
             .replace(/^["'“”]|["'“”]$/g, '')
             .replace(/\s+/g, ' ')
             .trim();
    return out;
  } finally {
    clearTimeout(timer);
  }
}

// ---- 主流程 ----
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.md')).sort();

let todo = [];
const report = [];

for (const f of files) {
  const art = readArticle(path.join(contentDir, f));
  if (!art) { report.push({ title: f, status: 'skip', note: '无 frontmatter' }); continue; }
  const desc = (art.fm.description || '').trim();
  const slug = f.replace(/\.md$/, '');
  const need = FORCE === slug || ALL || !desc || desc.length < cfg.minLength;
  if (need) todo.push({ art, desc, slug });
  else report.push({ title: art.fm.title || f, status: 'ok', note: `${desc.length} 字` });
}

console.log(`共 ${files.length} 篇，需要处理 ${todo.length} 篇（阈值 ${cfg.minLength} 字）`);
if (CHECK) {
  if (todo.length) {
    console.log('\n以下文章 description 缺失或过短：');
    todo.forEach((t) => console.log(`  ${String((t.desc || '').length).padStart(3)}字  ${t.art.fm.title || t.slug}`));
  } else console.log('\n全部达标，无需处理。');
  process.exit(0);
}

if (!todo.length) { console.log('没有需要补全的文章。'); process.exit(0); }

if (!cfg.apiKey) {
  console.error('\n未配置 API Key。请设置环境变量 AI_API_KEY，或在 ai.config.json 里填 apiKey。');
  console.error('可用的环境变量：AI_BASE_URL / AI_API_KEY / AI_MODEL / AI_MIN_LENGTH');
  process.exit(1);
}

console.log(`使用模型 ${cfg.model} @ ${cfg.baseUrl}`);
if (DRY) console.log('（--dry 模式，不会写入文件）\n');

let ok = 0, fail = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const t = queue.shift();
    const title = t.art.fm.title || t.slug;
    // 取正文前 ~1800 字，足够模型判断主题
    const bodyText = t.art.body
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/^#{1,6}\s.*$/gm, ' ')
      .replace(/^\s*[>\-*+|]\s*/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1800);
    try {
      const desc = await callAI(title, bodyText);
      const len = desc.length;
      if (!desc || len < 12) throw new Error(`返回内容过短(${len}字)：${desc.slice(0, 60)}`);
      console.log(`  ✓ ${title}`);
      console.log(`    ${desc}  (${len}字)`);
      if (!DRY) writeDescription(t.art, desc);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${title}  -> ${e.message}`);
      fail++;
    }
  }
}
await Promise.all(Array.from({ length: cfg.concurrency }, worker));

console.log(`\n完成：成功 ${ok}，失败 ${fail}${DRY ? '（dry-run，未写入）' : ''}`);
if (fail) process.exitCode = 1;
