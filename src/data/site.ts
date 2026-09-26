const siteOrigin = (import.meta.env.SITE_URL ?? 'https://www.nbbnbb.com.cn').replace(/\/$/, '');
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const siteUrl = `${siteOrigin}${basePath}`;

export const site = {
  name: 'nbbnbb',
  title: "NBB's Blog",
  description: '记录一些技术&杂七杂八.',
  url: siteUrl,
  author: {
    name: 'nbbnbb',
    bio: '记录一些技术&杂七杂八.',
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
