import { Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource, type LngLatLike, type MapLayerMouseEvent } from 'maplibre-gl';
// MapLibre looks for its worker next to its own module, which no longer exists once bundled.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { escapeHtml } from '../lib/html';

interface GlobePost {
  url: string;
  title: string;
  place: string;
  date: string;
  lat: number;
  lng: number;
  thumb?: string;
}

interface GlobeData {
  posts: GlobePost[];
  home: { name: string; lat: number; lng: number };
  accent: string;
}

interface View {
  center: [number, number];
  zoom: number;
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const SEA = '#0b0b0d';
const LAND = '#3a3a3c';
const BUILDING = '#2e2e30';
const LABEL_MIN_ZOOM = 4;
const START_ZOOM = 1.5;
const ARRIVAL_ZOOM = 3;
const POST_ZOOM = 5;
const VIEW_KEY = 'globe-view';
const MAX_LEAVES = 100;

const lngLat = (p: { lat: number; lng: number }): LngLatLike => [p.lng, p.lat];

function readView(): View | undefined {
  try {
    return JSON.parse(sessionStorage.getItem(VIEW_KEY) ?? 'null') ?? undefined;
  } catch {
    return undefined;
  }
}

function writeView(map: MapLibreMap) {
  const { lng, lat } = map.getCenter();
  try {
    sessionStorage.setItem(VIEW_KEY, JSON.stringify({ center: [lng, lat], zoom: map.getZoom() }));
  } catch {
    /* storage unavailable: the globe just starts at the latest post */
  }
}

function restyle(map: MapLibreMap) {
  map.setPaintProperty('background', 'background-color', LAND);
  map.setPaintProperty('water', 'fill-color', SEA);
  map.setPaintProperty('waterway', 'line-color', SEA);
  map.setPaintProperty('building', 'fill-color', BUILDING);
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'fill' && /^(landcover|landuse)/.test(layer.id)) {
      map.setPaintProperty(layer.id, 'fill-color', LAND);
    }
    if (layer.type === 'symbol') {
      map.setLayerZoomRange(layer.id, Math.max(LABEL_MIN_ZOOM, layer.minzoom ?? 0), layer.maxzoom ?? 24);
    }
  }
}

function addLayers(map: MapLibreMap, { posts, home, accent }: GlobeData) {
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [home, ...posts].map((p) => [p.lng, p.lat]) } },
  });
  map.addSource('posts', {
    type: 'geojson',
    cluster: true,
    clusterRadius: 40,
    clusterMaxZoom: 12,
    data: {
      type: 'FeatureCollection',
      features: posts.map((p, i) => ({ type: 'Feature', properties: { i }, geometry: { type: 'Point', coordinates: [p.lng, p.lat] } })),
    },
  });

  map.addLayer({ id: 'route', type: 'line', source: 'route', paint: { 'line-color': accent, 'line-width': 2, 'line-opacity': 0.7, 'line-dasharray': [2, 2] } });
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'posts',
    filter: ['has', 'point_count'],
    paint: { 'circle-color': accent, 'circle-radius': 16, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
  });
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'posts',
    filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 13 },
    paint: { 'text-color': '#fff' },
  });
  map.addLayer({
    id: 'points',
    type: 'circle',
    source: 'posts',
    filter: ['!', ['has', 'point_count']],
    paint: { 'circle-color': accent, 'circle-radius': 7, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
  });
  // Invisible, finger-sized hit area so small markers are tappable on phones.
  map.addLayer({
    id: 'points-hit',
    type: 'circle',
    source: 'posts',
    filter: ['!', ['has', 'point_count']],
    paint: { 'circle-radius': 20, 'circle-opacity': 0 },
  });
}

function createPreview(posts: GlobePost[]) {
  const card = document.getElementById('preview')!;

  const hide = () => {
    card.hidden = true;
    document.querySelectorAll('[data-fly][aria-current]').forEach((el) => el.removeAttribute('aria-current'));
  };

  const show = (items: GlobePost[]) => {
    const close = '<button class="close" type="button" aria-label="Sluiten">×</button>';
    if (items.length === 1) {
      const [p] = items;
      card.innerHTML = `${p.thumb ? `<img src="${escapeHtml(p.thumb)}" alt="">` : ''}<div class="content">${close}<span class="place">${escapeHtml(p.place)} · ${escapeHtml(p.date)}</span><h2>${escapeHtml(p.title)}</h2><a class="read" href="${escapeHtml(p.url)}">Lees verder →</a></div>`;
    } else {
      const list = items
        .map((p) => `<li><a href="${escapeHtml(p.url)}"><span class="place">${escapeHtml(p.place)} · ${escapeHtml(p.date)}</span><br>${escapeHtml(p.title)}</a></li>`)
        .join('');
      card.innerHTML = `<div class="content">${close}<h2>${items.length} posts</h2><ul>${list}</ul></div>`;
    }
    card.querySelector('.close')!.addEventListener('click', hide);
    card.hidden = false;
    const current = items.length === 1 ? items[0].url : undefined;
    document.querySelectorAll<HTMLElement>('[data-fly]').forEach((el) => {
      if (el.dataset.fly === current) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  };

  document.addEventListener('keydown', (e) => e.key === 'Escape' && hide());
  return { show, hide, byIndex: (i: number) => posts[i] };
}

function bindEvents(map: MapLibreMap, data: GlobeData, preview: ReturnType<typeof createPreview>) {
  const flyTo = (p: GlobePost) => map.flyTo({ center: lngLat(p), zoom: Math.max(map.getZoom(), POST_ZOOM) });

  map.on('click', 'points-hit', (e: MapLayerMouseEvent) => {
    const post = preview.byIndex(e.features![0].properties.i);
    preview.show([post]);
  });

  map.on('click', 'clusters', async (e: MapLayerMouseEvent) => {
    const source = map.getSource<GeoJSONSource>('posts')!;
    const leaves = await source.getClusterLeaves(e.features![0].properties.cluster_id, MAX_LEAVES, 0);
    preview.show(leaves.map((f) => preview.byIndex(f.properties!.i)).reverse());
  });

  for (const layer of ['points-hit', 'clusters']) {
    map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
  }

  document.querySelectorAll<HTMLAnchorElement>('[data-fly]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const post = data.posts.find((p) => p.url === link.dataset.fly);
      if (!post) return;
      e.preventDefault();
      flyTo(post);
      preview.show([post]);
    });
  });

  map.on('moveend', () => writeView(map));
}

export function initGlobe() {
  setWorkerUrl(workerUrl);
  const data = JSON.parse(document.getElementById('globe-data')!.textContent!) as GlobeData;
  const requested = new URLSearchParams(location.search).get('post');
  const focus = data.posts.find((p) => p.url === requested) ?? data.posts.at(-1) ?? data.home;
  const saved = readView();

  const map = new MapLibreMap({
    container: 'globe',
    style: STYLE_URL,
    center: saved?.center ?? lngLat(focus),
    zoom: saved?.zoom ?? START_ZOOM,
    attributionControl: { compact: true },
  });
  const preview = createPreview(data.posts);

  map.on('style.load', () => {
    map.setProjection({ type: 'globe' });
    restyle(map);
  });

  map.on('load', () => {
    addLayers(map, data);
    bindEvents(map, data, preview);
    const latest = data.posts.at(-1);
    if (latest) {
      const el = document.createElement('button');
      el.className = 'pulse';
      el.type = 'button';
      el.setAttribute('aria-label', `Nu: ${latest.place}`);
      el.addEventListener('click', () => preview.show([latest]));
      new Marker({ element: el }).setLngLat(lngLat(latest)).addTo(map);
    }
    if (!saved) map.flyTo({ center: lngLat(focus), zoom: ARRIVAL_ZOOM, duration: 3000 });
  });
}
