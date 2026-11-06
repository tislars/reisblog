import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { REPO_URL } from '../config';

const CACHE_FILE = resolve('data/geocode-cache.json');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_INTERVAL_MS = 1100;
// Two decimals ≈ 1 km: enough for the globe, vague enough not to pinpoint where I sleep.
const PRECISION = 100;

export interface Coords {
  lat: number;
  lng: number;
}

type Lookup = (place: string) => Promise<Coords | undefined>;

export const roundCoords = ({ lat, lng }: Coords): Coords => ({
  lat: Math.round(lat * PRECISION) / PRECISION,
  lng: Math.round(lng * PRECISION) / PRECISION,
});

const cacheKey = (place: string) => place.trim().toLowerCase();

let cachePromise: Promise<Record<string, Coords>> | undefined;
let queue: Promise<unknown> = Promise.resolve();

const loadCache = () =>
  (cachePromise ??= readFile(CACHE_FILE, 'utf8').then(JSON.parse, () => ({})));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const nominatim: Lookup = async (place) => {
  const params = new URLSearchParams({ q: place, format: 'jsonv2', limit: '1' });
  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': `reisblog-build (${REPO_URL})`, 'Accept-Language': 'nl' },
  });
  if (!response.ok) throw new Error(`Nominatim returned ${response.status} for "${place}"`);
  const [hit] = (await response.json()) as { lat: string; lon: string }[];
  return hit && { lat: Number(hit.lat), lng: Number(hit.lon) };
};

export async function coordsFor(
  post: { place: string; lat?: number | null; lng?: number | null },
  lookup: Lookup = nominatim,
): Promise<Coords> {
  if (post.lat != null && post.lng != null) return roundCoords({ lat: post.lat, lng: post.lng });

  const cache = await loadCache();
  const key = cacheKey(post.place);
  if (!cache[key]) {
    const task = queue.then(async () => {
      if (cache[key]) return;
      const found = await lookup(post.place);
      if (!found) throw new Error(`No location found for "${post.place}"; set lat/lng on the post`);
      cache[key] = roundCoords(found);
      await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
      await sleep(NOMINATIM_INTERVAL_MS);
    });
    queue = task.catch(() => undefined);
    await task;
  }
  return cache[key];
}
