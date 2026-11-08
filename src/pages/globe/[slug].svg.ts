import type { APIRoute, GetStaticPaths } from 'astro';
import { HOME } from '../../config';
import { miniGlobeSvg } from '../../lib/miniglobe';
import { getPosts, type Post } from '../../lib/posts';

/** A small globe per post, centred on that post: shown on the previous post as the "next stop". */
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  // The route up to and including this stop: the globe shows how the reader got there, not what comes after.
  return posts.map((post, i) => ({ params: { slug: post.entry.id }, props: { post, route: [HOME, ...posts.slice(0, i + 1)] } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post; route: { lat: number; lng: number }[] }> = ({ props: { post, route } }) =>
  new Response(miniGlobeSvg({ route: route.map(({ lat, lng }) => ({ lat, lng })), stop: post, day: post.day }), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
