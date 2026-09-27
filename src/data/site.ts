const siteOrigin = (import.meta.env.SITE_URL ?? 'https://www.nbbnbb.com.cn').replace(/\/$/, '');
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const siteUrl = `${siteOrigin}${basePath}`;

export const site = {
  brand: "NBB's Blog",
  // 标签页 / RSS / 404 用；logo 用 brand
  get title() { return this.brand; },
  name: 'Notes on Craft',
  description: '关于技术、风景与 AI。',
  url: siteUrl,
  author: {
    name: 'nbbnbb',
    bio: 'About me',
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
