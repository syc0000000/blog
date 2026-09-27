import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();
const contentRoot = path.join(root, 'src', 'content');
const publicRoot = path.join(root, 'public');
const errors = [];
const warnings = [];

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : /\.(md|mdx)$/.test(entry.name) ? [target] : [];
  });
}

function frontmatter(file) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, frontmatter: '', body: source };
  return { data: parse(match[1]) ?? {}, frontmatter: match[1], body: source.slice(match[0].length) };
}

function isDraft(entry) {
  return entry.data.draft === true || entry.data.draft === 'true';
}

function relative(entry) {
  return path.relative(root, entry.file);
}

const collections = ['writing'];
const entries = new Map();
for (const collection of collections) {
  const directory = path.join(contentRoot, collection);
  const current = filesIn(directory).map((file) => ({ collection, file, ...frontmatter(file) }));
  entries.set(collection, current);
  for (const entry of current) {
    for (const required of ['title', 'description', 'locale']) {
      if (!entry.data[required]) errors.push(`${relative(entry)}: missing ${required}`);
    }
    if (entry.data.locale && !['zh-cn', 'en'].includes(entry.data.locale)) errors.push(`${relative(entry)}: unsupported locale ${entry.data.locale}`);
    if (isDraft(entry)) continue;
    if (collection === 'writing' && !entry.data.publishedAt) errors.push(`${relative(entry)}: missing publishedAt`);
  }
}

const translationKeys = new Set();
for (const [collection, current] of entries) {
  for (const entry of current) {
    const key = entry.data.translationKey;
    if (!key || isDraft(entry)) continue;
    const identity = `${collection}:${entry.data.locale}:${key}`;
    if (translationKeys.has(identity)) errors.push(`${relative(entry)}: duplicate ${identity}`);
    translationKeys.add(identity);
  }
}

const paths = new Set();
function addPath(entry, url) {
  if (paths.has(url)) errors.push(`${relative(entry)}: duplicate public path ${url}`);
  paths.add(url);
}
function entrySlug(entry) {
  return path.basename(entry.file).replace(/\.(md|mdx)$/, '');
}
function datePath(entry, collection) {
  const date = new Date(entry.data.publishedAt);
  return `/${collection}/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${entrySlug(entry)}/`;
}
for (const entry of entries.get('writing')) {
  if (!isDraft(entry) && entry.data.publishedAt) addPath(entry, datePath(entry, 'writing'));
}

const tagPaths = new Map();
const tagSlug = (tag) => tag.toLowerCase().trim().replace(/[\\/?#%]+/g, '-').replace(/\s+/g, '-');
for (const entry of entries.get('writing')) {
  if (isDraft(entry)) continue;
  const tags = Array.isArray(entry.data.tags) ? entry.data.tags : [];
  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const slug = tagSlug(tag);
    const previous = tagPaths.get(slug);
    if (previous && previous !== tag) errors.push(`${relative(entry)}: tags "${previous}" and "${tag}" share slug ${slug}`);
    tagPaths.set(slug, tag);
  }
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Content validation passed: ${[...entries.values()].reduce((count, items) => count + items.length, 0)} entries checked.`);
}
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

// description 长度体检：只警告不阻断。需要补全时跑 `npm run ai:descriptions`。
const SHORT_DESC = 25;
const shortDescs = entries
  .get('writing')
  .filter((entry) => !isDraft(entry))
  .map((entry) => ({ title: entry.data.title ?? '?', len: String(entry.data.description ?? '').length }))
  .filter((item) => item.len < SHORT_DESC)
  .sort((a, b) => a.len - b.len);
if (shortDescs.length) {
  console.warn(`Descriptions shorter than ${SHORT_DESC} chars (${shortDescs.length}):`);
  shortDescs.forEach((item) => console.warn(`- ${item.len} chars: ${item.title}`));
  console.warn(`  Run \`npm run ai:descriptions\` to fill them with AI.`);
}
