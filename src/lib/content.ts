import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import { site } from '../data/site';

import { sitePath } from './urls';

export type Writing = CollectionEntry<'writing'>;

export async function getPublishedWriting(locale = site.locale) {
  const entries = await getCollection('writing', ({ data }) => !data.draft && data.locale === locale);
  return entries.sort((a, b) => {
    const aDate = a.data.updatedAt ?? a.data.publishedAt;
    const bDate = b.data.updatedAt ?? b.data.publishedAt;
    return bDate.valueOf() - aDate.valueOf();
  });
}

export async function getPublishedCollection<T extends CollectionKey>(
  name: T,
  locale = site.locale,
): Promise<CollectionEntry<T>[]> {
  return getCollection(name, ({ data }) => !data.draft && data.locale === locale) as Promise<CollectionEntry<T>[]>;
}

export function byDate<T extends { data: { publishedAt: Date } }>(entries: T[]) {
  return [...entries].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export function slugFromId(id: string) {
  return id.replace(/^.*\//, '').replace(/\.(md|mdx)$/, '');
}

export function writingPath(entry: Writing) {
  const date = entry.data.publishedAt;
  return sitePath(`/writing/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${slugFromId(entry.id)}/`);
}

export function yearOf(entry: Writing) {
  return entry.data.publishedAt.getFullYear();
}

export function getTags(entries: Writing[], threshold = site.tagIndexThreshold) {
  const counts = new Map<string, number>();
  for (const entry of entries) for (const tag of entry.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function tagSlug(tag: string) {
  return tag.toLowerCase().trim().replace(/[\\/?#%]+/g, '-').replace(/\s+/g, '-');
}

export function excerpt(text: string, length = 180) {
  const clean = text.replace(/[#*_>`\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
}
