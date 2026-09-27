const siteOrigin = (import.meta.env.SITE_URL ?? 'https://www.nbbnbb.com.cn').replace(/\/$/, '');
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const siteUrl = `${siteOrigin}${basePath}`;

export const site = {
  name: '在 AI 时代，生产与生活',
  title: "NBB's Blog",
  description: '记录技术、工具与日常，也记录 AI 带来的变化。',
  url: siteUrl,
  author: {
    name: 'nbbnbb',
    bio: 'Java 后端 · 关注 AI 工程实践',
    email: '',
  },
  locale: 'zh-cn',
  locales: ['zh-cn', 'en'] as const,
  writingPageSize: 8,
  tagIndexThreshold: 1,
  license: {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },
  social: [{ label: 'GitHub', href: 'https://github.com/syc0000000' }],
  features: {
    search: true,
    favorites: true,
    theme: true,
    rss: true,
    share: true,
    tips: false,
    newsletter: false,
    comments: false,
  },
} as const;

export type Locale = (typeof site.locales)[number];
