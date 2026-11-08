import { Map as MapLibreMap, Marker, setWorkerUrl, type FillLayerSpecification, type GeoJSONSource, type LngLatLike, type MapLayerMouseEvent } from 'maplibre-gl';
// MapLibre looks for its worker next to its own module, which no longer exists once bundled.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { distanceKm } from '../lib/geo';
import { escapeHtml } from '../lib/html';
import { MAP_COLORS, globeOutlineRadius, graticule, minZoomFor, northCap, paintFor, zoomForGlobeRadius } from '../lib/mapstyle';
import { snapZoom, stepZoom, zoomLevels } from '../lib/zoom';

interface GlobePost {
  url: string;
  title: string;
  place: string;
  placeName: string;
  date: string;
  day: number;
  lat: number;
  lng: number;
  thumb?: string;
  thumbSrcset?: string;
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

type PaintName = Parameters<MapLibreMap['setPaintProperty']>[1];

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const MIN_ZOOM = 1;
// Share of the map's shorter side the globe's radius takes on arrival, as in the design.
const GLOBE_FIT = 0.43;
const POST_ZOOM = 5;
const MAX_ZOOM = 15;
const ZOOM_LEVELS = zoomLevels(MIN_ZOOM, MAX_ZOOM, 8);
const WHEEL_GESTURE_GAP_MS = 200;
const VIEW_KEY = 'globe-view';
const MAX_LEAVES = 100;
// About 70° of arc from the centre of view: beyond this a point sits close to or behind the globe's edge.
const FAR_SIDE_KM = 7800;


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
  for (const layer of map.getStyle().layers) {
    const style = layer as Parameters<typeof paintFor>[0];
    for (const [property, value] of Object.entries(paintFor(style) ?? {})) map.setPaintProperty(layer.id, property as PaintName, value);
    const minzoom = minZoomFor(style);
    if (minzoom !== undefined) map.setLayerZoomRange(layer.id, minzoom, layer.maxzoom ?? 24);
  }

  // Graticule and coastline in ink above all area fills, below roads and labels. OpenFreeMap has no
  // coastline layer, so outline the water polygons instead. (The land is the background, so the grid can't stop at the coast.)
  const layers = map.getStyle().layers;
  const water = layers.find((l) => l.id === 'water') as FillLayerSpecification | undefined;
  const lastFill = layers.findLastIndex((l) => l.type === 'fill' && l['source-layer'] !== 'building');
  const above = layers[lastFill + 1]?.id;
  map.addSource('graticule', { type: 'geojson', data: graticule() });
  map.addLayer({ id: 'graticule', type: 'line', source: 'graticule', paint: { 'line-color': MAP_COLORS.line, 'line-width': 0.6 } }, above);
  map.addLayer(
    {
      id: 'coast',
      type: 'line',
      source: water?.source ?? 'openmaptiles',
      'source-layer': 'water',
      filter: water?.filter,
      paint: { 'line-color': MAP_COLORS.ink, 'line-width': 0.7 },
    },
    above,
  );
  map.addSource('north-cap', { type: 'geojson', data: northCap() });
  map.addLayer({ id: 'north-cap', type: 'fill', source: 'north-cap', paint: { 'fill-color': MAP_COLORS.paper } }, above);
}

/** The edge of the globe as an ink circle; MapLibre has no layer for it, so it is an element sized to match. */
function addRim(map: MapLibreMap) {
  const rim = document.createElement('div');
  rim.className = 'globe-rim';
  rim.setAttribute('aria-hidden', 'true');
  map.getCanvasContainer().after(rim);
  const update = () => {
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    const r = globeOutlineRadius(map.getZoom(), map.getCenter().lat, height);
    // Once zoomed in past the screen corners the edge is out of view; skip giant elements.
    rim.hidden = r > Math.hypot(width, height);
    rim.style.width = rim.style.height = `${2 * r}px`;
  };
  map.on('move', update);
  map.on('resize', update);
  update();
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

  map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': accent, 'line-width': 1.6 } });
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'posts',
    filter: ['has', 'point_count'],
    paint: { 'circle-color': MAP_COLORS.paper, 'circle-radius': 13, 'circle-stroke-color': accent, 'circle-stroke-width': 1.6 },
  });
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'posts',
    filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 13 },
    paint: { 'text-color': MAP_COLORS.ink },
  });
  map.addLayer({
    id: 'points',
    type: 'circle',
    source: 'posts',
    filter: ['!', ['has', 'point_count']],
    paint: { 'circle-color': MAP_COLORS.paper, 'circle-radius': 6, 'circle-stroke-color': accent, 'circle-stroke-width': 1.6 },
  });
  // The post under the pointer or keyboard focus in the index; unclustered so it shows at any zoom.
  map.addSource('focus', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'focus',
    type: 'circle',
    source: 'focus',
    paint: { 'circle-color': accent, 'circle-radius': 8, 'circle-stroke-color': MAP_COLORS.paper, 'circle-stroke-width': 2 },
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
  let returnTo: HTMLElement | undefined;
  const hide = () => {
    if (card.hidden) return;
    card.hidden = true;
    returnTo?.focus();
  };
  const day = (p: GlobePost) => `Dag ${String(p.day).padStart(2, '0')} · ${escapeHtml(p.placeName)}`;

  const show = (items: GlobePost[]) => {
    const close = '<button class="close" type="button" aria-label="Sluiten">×</button>';
    if (items.length === 1) {
      const [p] = items;
      card.innerHTML = `${p.thumb ? `<img src="${escapeHtml(p.thumb)}"${p.thumbSrcset ? ` srcset="${escapeHtml(p.thumbSrcset)}" sizes="20rem"` : ''} alt="">` : ''}<div class="content">${close}<span class="label">${day(p)}</span><h2>${escapeHtml(p.title)}</h2><span class="date">${escapeHtml(p.date)}</span><a class="read" href="${escapeHtml(p.url)}">Lees verder →</a></div>`;
    } else {
      const list = items.map((p) => `<li><a href="${escapeHtml(p.url)}"><span class="label">${day(p)}</span>${escapeHtml(p.title)}</a></li>`).join('');
      card.innerHTML = `<div class="content">${close}<h2>${items.length} posts</h2><ul>${list}</ul></div>`;
    }
    const closeButton = card.querySelector<HTMLButtonElement>('.close')!;
    closeButton.addEventListener('click', hide);
    card.hidden = false;
    returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    closeButton.focus();
  };

  document.addEventListener('keydown', (e) => e.key === 'Escape' && hide());
  return { show, hide, byIndex: (i: number) => posts[i] };
}

/** Hovering or focusing a row in the index marks its post on the globe. */
function bindIndex(map: MapLibreMap, data: GlobeData) {
  const source = map.getSource<GeoJSONSource>('focus')!;
  let marked: string | undefined;

  // A post on the far side of the globe or off-screen would light up unseen.
  const inView = (post: GlobePost) => {
    const { lng, lat } = map.getCenter();
    if (distanceKm({ lat, lng }, post) > FAR_SIDE_KM) return false;
    const { x, y } = map.project(lngLat(post));
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    return x >= 0 && y >= 0 && x <= width && y <= height;
  };

  const mark = (url?: string) => {
    if (url === marked) return;
    marked = url;
    const post = data.posts.find((p) => p.url === url);
    // Turning towards it is not a view the reader chose, so it isn't remembered (see moveend).
    if (post && !inView(post)) map.easeTo({ center: lngLat(post), duration: 600 }, { fromIndex: true });
    source.setData({
      type: 'FeatureCollection',
      features: post ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [post.lng, post.lat] } }] : [],
    });
  };

  const row = (el: EventTarget | Element | null) => (el instanceof Element ? el.closest<HTMLElement>('[data-post]') : null);
  // When the pointer leaves, fall back to the row that has keyboard focus, if any.
  const focused = () => row(document.activeElement)?.dataset.post;
  document.querySelectorAll('.idx').forEach((index) => {
    index.addEventListener('mouseover', (e) => mark(row(e.target)?.dataset.post));
    index.addEventListener('mouseleave', () => mark(focused()));
    index.addEventListener('focusin', (e) => mark(row(e.target)?.dataset.post));
    index.addEventListener('focusout', (e) => mark(row((e as FocusEvent).relatedTarget)?.dataset.post));
  });
}

function bindEvents(map: MapLibreMap, preview: ReturnType<typeof createPreview>) {
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

  map.on('moveend', (e) => {
    if (!(e as { fromIndex?: boolean }).fromIndex) writeView(map);
  });
}

function bindZoomSteps(map: MapLibreMap) {
  const container = map.getContainer();
  const stepAround = (direction: 1 | -1, x: number, y: number) => {
    const rect = container.getBoundingClientRect();
    const zoom = stepZoom(ZOOM_LEVELS, map.getZoom(), direction);
    // Zooming out around the cursor swings the globe's centre latitude and with it the zoom, so only zoom in around it.
    map.easeTo(direction > 0 ? { zoom, around: map.unproject([x - rect.left, y - rect.top]) } : { zoom });
  };

  // One step per wheel gesture: a trackpad swipe fires dozens of events, so wait for a pause before stepping again.
  let gesture: ReturnType<typeof setTimeout> | undefined;
  container.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const busy = gesture !== undefined;
      clearTimeout(gesture);
      gesture = setTimeout(() => (gesture = undefined), WHEEL_GESTURE_GAP_MS);
      if (!busy && e.deltaY !== 0) stepAround(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
    },
    { passive: false },
  );
  container.addEventListener('dblclick', (e) => stepAround(e.shiftKey ? -1 : 1, e.clientX, e.clientY));

  // Pinch and keyboard zoom freely; settle on the next level in the direction they went.
  let from = map.getZoom();
  map.on('zoomstart', () => (from = map.getZoom()));
  map.on('zoomend', (e) => {
    if (!e.originalEvent) return;
    const target = snapZoom(ZOOM_LEVELS, from, map.getZoom());
    if (target !== map.getZoom()) map.easeTo({ zoom: target });
  });
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
    zoom: saved?.zoom ?? MIN_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    maxPitch: 0, // the rim assumes a straight-down view
    scrollZoom: false,
    doubleClickZoom: false,
    attributionControl: { compact: true },
  });
  const preview = createPreview(data.posts);
  bindZoomSteps(map);

  map.on('style.load', () => {
    map.setProjection({ type: 'globe' });
    restyle(map);
  });

  map.on('load', () => {
    // The compact attribution starts expanded and then covers the legend; start it collapsed (the ⓘ stays).
    const attrib = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
    attrib?.classList.remove('maplibregl-compact-show');
    attrib?.removeAttribute('open');
    addLayers(map, data);
    addRim(map);
    map.getContainer().closest('.map')?.classList.add('ready');
    bindEvents(map, preview);
    bindIndex(map, data);
    const latest = data.posts.at(-1);
    if (latest) {
      const el = document.createElement('button');
      el.className = 'pulse';
      el.type = 'button';
      el.textContent = String(latest.day);
      el.setAttribute('aria-label', `Nu: dag ${latest.day} in ${latest.place}`);
      el.addEventListener('click', () => preview.show([latest]));
      new Marker({ element: el, opacityWhenCovered: 0 }).setLngLat(lngLat(latest)).addTo(map);
    }
    const { clientWidth: width, clientHeight: height } = map.getContainer();
    const arrival = Math.max(MIN_ZOOM, zoomForGlobeRadius(GLOBE_FIT * Math.min(width, height), focus.lat, height));
    if (!saved) map.flyTo({ center: lngLat(focus), zoom: arrival, duration: 3000 });
    else if ('url' in focus && focus.url === requested) map.flyTo({ center: lngLat(focus), zoom: Math.max(map.getZoom(), POST_ZOOM), duration: 1500 });
  });
}
