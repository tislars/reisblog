import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../config';
import { getPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: new URL(import.meta.env.BASE_URL, context.site),
    items: posts.reverse().map((post) => ({
      title: post.entry.data.title,
      description: post.entry.data.place,
      pubDate: post.entry.data.date,
      link: post.url,
    })),
  });
}
