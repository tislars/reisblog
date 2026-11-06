import { escapeHtml } from './html';

const API_URL ='https://api.flickr.com/services/rest/';
const THUMB_MAX_EDGE = 800;
const LARGE_MAX_EDGE = 2048;
// Flickr API Terms of Use §1.2: no more than 30 Flickr photos per page.
export const MAX_PHOTOS_PER_PAGE = 30;

const REF = String.raw`(?:https?:\/\/(?:www\.)?flickr\.com\/photos\/[^/\s<>]+\/(\d+)[^\s<>]*|flickr:(\d+))`;
const HTML_PARAGRAPH = new RegExp(String.raw`<p>\s*(?:<a [^>]*>)?\s*${REF}\s*(?:<\/a>)?\s*<\/p>`, 'g');

export interface PhotoSize {
  src: string;
  width: number;
  height: number;
}

export interface FlickrPhoto {
  id: string;
  title: string;
  alt: string;
  pageUrl: string;
  thumb: PhotoSize;
  large: PhotoSize;
}

interface RawSize {
  label: string;
  source: string;
  width: number | string;
  height: number | string;
}

export function parseFlickrRef(ref: string): string | undefined {
  const trimmed = ref.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(new RegExp(`^${REF}$`));
  return match?.[1] ?? match?.[2];
}

/** IDs of Flickr refs that sit alone in a paragraph of rendered post HTML. */
export function photoIdsInHtml(html: string): string[] {
  return [...html.matchAll(HTML_PARAGRAPH)].map((m) => m[1] ?? m[2]);
}

export function pickSizes(sizes: RawSize[]): { thumb: PhotoSize; large: PhotoSize } {
  const parsed = sizes
    .map((s) => ({ src: s.source, width: Number(s.width), height: Number(s.height) }))
    .sort((a, b) => Math.max(a.width, a.height) - Math.max(b.width, b.height));
  if (parsed.length === 0) throw new Error('Flickr returned no sizes');
  const largestUpTo = (edge: number) =>
    parsed.filter((s) => Math.max(s.width, s.height) <= edge).at(-1) ?? parsed[0];
  return { thumb: largestUpTo(THUMB_MAX_EDGE), large: largestUpTo(LARGE_MAX_EDGE) };
}

function figure(photo: FlickrPhoto): string {
  const caption = photo.title ? `<figcaption>${escapeHtml(photo.title)}</figcaption>` : '';
  return `<figure class="photo"><a href="${escapeHtml(photo.large.src)}" data-pswp-width="${photo.large.width}" data-pswp-height="${photo.large.height}" data-flickr-page="${escapeHtml(photo.pageUrl)}" target="_blank" rel="noopener"><img src="${escapeHtml(photo.thumb.src)}" width="${photo.thumb.width}" height="${photo.thumb.height}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async"></a>${caption}</figure>`;
}

export async function embedFlickrPhotos(
  html: string,
  fetchPhoto: (id: string) => Promise<FlickrPhoto> = getPhoto,
): Promise<string> {
  const ids = photoIdsInHtml(html);
  if (ids.length > MAX_PHOTOS_PER_PAGE) {
    throw new Error(`Post has ${ids.length} photos; Flickr allows at most ${MAX_PHOTOS_PER_PAGE} per page`);
  }
  const photos = new Map(await Promise.all(ids.map(async (id) => [id, await fetchPhoto(id)] as const)));
  return html.replace(HTML_PARAGRAPH, (_, a?: string, b?: string) => figure(photos.get((a ?? b)!)!));
}

async function callApi<T>(method: string, photoId: string): Promise<T> {
  const apiKey = import.meta.env.FLICKR_API_KEY ?? process.env.FLICKR_API_KEY;
  if (!apiKey) throw new Error('FLICKR_API_KEY is not set');
  const params = new URLSearchParams({ method, api_key: apiKey, photo_id: photoId, format: 'json', nojsoncallback: '1' });
  const response = await fetch(`${API_URL}?${params}`);
  const json = await response.json();
  if (json.stat !== 'ok') throw new Error(`Flickr ${method} failed for photo ${photoId}: ${json.message}`);
  return json as T;
}

const stripTags = (html: string) => html.replace(/<[^>]*>/g, '').trim();

async function fetchPhoto(id: string): Promise<FlickrPhoto> {
  const [info, sizes] = await Promise.all([
    callApi<{ photo: { title: { _content: string }; description: { _content: string }; urls: { url: { _content: string }[] } } }>('flickr.photos.getInfo', id),
    callApi<{ sizes: { size: RawSize[] } }>('flickr.photos.getSizes', id),
  ]);
  const title = info.photo.title._content.trim();
  return {
    id,
    title,
    alt: stripTags(info.photo.description._content) || title,
    pageUrl: info.photo.urls.url[0]?._content ?? `https://www.flickr.com/photo.gne?id=${id}`,
    ...pickSizes(sizes.sizes.size),
  };
}

const cache = new Map<string, Promise<FlickrPhoto>>();

export function getPhoto(id: string): Promise<FlickrPhoto> {
  if (!cache.has(id)) cache.set(id, fetchPhoto(id));
  return cache.get(id)!;
}
