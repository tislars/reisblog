import { escapeHtml } from './html';

const API_URL ='https://api.flickr.com/services/rest/';
const THUMB_MAX_EDGE = 800;
const LARGE_MAX_EDGE = 2048;
// Flickr API Terms of Use §1.2: no more than 30 Flickr photos per page.
export const MAX_PHOTOS_PER_PAGE = 30;

const REF = String.raw`(?:https?:\/\/(?:www\.)?flickr\.com\/photos\/[^/\s<>]+\/(\d+)[^\s<>]*|flickr:(\d+))`;
const MAX_PHOTOS_PER_ROW = 3;
const LINKED_REF = String.raw`\s*(?:<br\s*\/?>)?\s*(?:<a [^>]*>)?\s*${REF.replaceAll(String.raw`(\d+)`, String.raw`\d+`)}\s*(?:<\/a>)?`;
// A paragraph of 1–3 refs, one per line: a single photo, or a row of photos side by side.
const HTML_PARAGRAPH = new RegExp(String.raw`<p>((?:${LINKED_REF}){1,${MAX_PHOTOS_PER_ROW}})\s*<\/p>`, 'g');

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
  /** Uncropped sizes up to LARGE_MAX_EDGE, smallest first, for srcset. */
  variants: PhotoSize[];
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

const idsInParagraph = (inner: string) =>
  [...inner.replace(/<[^>]*>/g, ' ').matchAll(new RegExp(REF, 'g'))].map((m) => m[1] ?? m[2]);

/** IDs of Flickr refs in photo paragraphs (refs alone on their lines) of rendered post HTML. */
export function photoIdsInHtml(html: string): string[] {
  return [...html.matchAll(HTML_PARAGRAPH)].flatMap((m) => idsInParagraph(m[1]));
}

const edge = (s: PhotoSize) => Math.max(s.width, s.height);

export function pickSizes(sizes: RawSize[]): { thumb: PhotoSize; large: PhotoSize; variants: PhotoSize[] } {
  // Square sizes are crops; they would distort the photo in a srcset.
  const parsed = sizes
    .filter((s) => !/square/i.test(s.label))
    .map((s) => ({ src: s.source, width: Number(s.width), height: Number(s.height) }))
    .sort((a, b) => edge(a) - edge(b));
  if (parsed.length === 0) throw new Error('Flickr returned no sizes');
  const upTo = (max: number) => parsed.filter((s) => edge(s) <= max);
  const largestUpTo = (max: number) => upTo(max).at(-1) ?? parsed[0];
  const large = largestUpTo(LARGE_MAX_EDGE);
  const variants = upTo(LARGE_MAX_EDGE);
  return { thumb: largestUpTo(THUMB_MAX_EDGE), large, variants: variants.length ? variants : [large] };
}

/** A srcset of the photo's variants, optionally capped at a maximum edge (e.g. for small cards). */
export function srcset(photo: Pick<FlickrPhoto, 'variants'>, maxEdge = Infinity): string {
  const seen = new Set<number>();
  return photo.variants
    .filter((v) => edge(v) <= maxEdge && !seen.has(v.width) && seen.add(v.width))
    .map((v) => `${v.src} ${v.width}w`)
    .join(', ');
}

// Layout widths of photos in a post body (see .body in [slug].astro): the 1100px page minus 2 × 40px padding;
// photos in a row share it equally (the small gap between them is ignored).
const PAGE_WIDTH = 1020;
const figureSizes = (perRow: number) =>
  `(min-width: ${PAGE_WIDTH + 80}px) ${Math.round(PAGE_WIDTH / perRow)}px, ${Math.round(100 / perRow)}vw`;

function figure(photo: FlickrPhoto, perRow = 1): string {
  // Always a caption, even without a title: the page numbers every figure (FIG. 2, FIG. 3, …) in it.
  const caption = `<figcaption>${escapeHtml(photo.title)}</figcaption>`;
  // A lone photo spans the page but no taller than the screen (see [slug].astro); photos in a row are cropped.
  const ratio = perRow === 1 ? ` style="--ar: ${(photo.thumb.width / photo.thumb.height).toFixed(3)}"` : '';
  const cropped = perRow > 1 ? ' data-cropped="true"' : '';
  return `<figure class="photo"${ratio}><a href="${escapeHtml(photo.large.src)}" data-pswp-width="${photo.large.width}" data-pswp-height="${photo.large.height}" data-flickr-page="${escapeHtml(photo.pageUrl)}"${cropped} target="_blank" rel="noopener"><img src="${escapeHtml(photo.thumb.src)}" srcset="${escapeHtml(srcset(photo))}" sizes="${figureSizes(perRow)}" width="${photo.thumb.width}" height="${photo.thumb.height}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async"></a>${caption}</figure>`;
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
  return html.replace(HTML_PARAGRAPH, (_, inner: string) => {
    const row = idsInParagraph(inner).map((id, _i, all) => figure(photos.get(id)!, all.length));
    return row.length === 1 ? row[0] : `<div class="photo-row">${row.join('')}</div>`;
  });
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

const MAX_ALT_LENGTH = 150;
// Default names from cameras and phones (IMG_4021, DSC-0012.jpg, PXL_20261107_…): not a caption.
const CAMERA_FILE_NAME = /^(IMG|DSC[FN]?|PXL|GOPR|DJI|P\d{3}|_MG)[_-]?\d+(?:[_-]\d+)*(?:\.\w+)?$/i;

const plainText = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Alt text and caption from a Flickr title and description. Flickr descriptions can be essays,
 * so alt is the description only when short, else its first sentence, else the title.
 */
export function describePhoto(title: string, description: string): { alt: string; caption: string } {
  const caption = CAMERA_FILE_NAME.test(title.trim()) ? '' : title.trim();
  const text = plainText(description);
  const firstSentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  const alt = [text, firstSentence, caption].find((t) => t && t.length <= MAX_ALT_LENGTH) ?? 'Foto';
  return { alt, caption };
}

async function fetchPhoto(id: string): Promise<FlickrPhoto> {
  const [info, sizes] = await Promise.all([
    callApi<{ photo: { title: { _content: string }; description: { _content: string }; urls: { url: { _content: string }[] } } }>('flickr.photos.getInfo', id),
    callApi<{ sizes: { size: RawSize[] } }>('flickr.photos.getSizes', id),
  ]);
  const { alt, caption } = describePhoto(info.photo.title._content, info.photo.description._content);
  return {
    id,
    title: caption,
    alt,
    pageUrl: info.photo.urls.url[0]?._content ?? `https://www.flickr.com/photo.gne?id=${id}`,
    ...pickSizes(sizes.sizes.size),
  };
}

const cache = new Map<string, Promise<FlickrPhoto>>();

export function getPhoto(id: string): Promise<FlickrPhoto> {
  if (!cache.has(id)) cache.set(id, fetchPhoto(id));
  return cache.get(id)!;
}
