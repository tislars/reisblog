import { getCollection, type CollectionEntry } from 'astro:content';
import { coordsFor, type Coords } from './geocode';
import { parseFlickrRef, photoIdsInHtml } from './flickr';

export type PostEntry = CollectionEntry<'posts'>;

export interface Post extends Coords {
  entry: PostEntry;
  slug: string;
  year: string;
  month: string;
  url: string;
  coverId?: string;
}

export const withBase = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

async function toPost(entry: PostEntry): Promise<Post> {
  const { date, cover } = entry.data;
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const slug = entry.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return {
    entry,
    slug,
    year,
    month,
    url: withBase(`${year}/${month}/${slug}/`),
    coverId: (cover && parseFlickrRef(cover)) || photoIdsInHtml(entry.rendered?.html ?? '')[0],
    ...(await coordsFor(entry.data)),
  };
}

/** Published posts, oldest first. Drafts are only included in dev. */
export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  entries.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  return Promise.all(entries.map(toPost));
}
