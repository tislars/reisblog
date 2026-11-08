/** Coordinates and distances, written the Dutch way: N/Z and O/W. */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function degreesMinutes(value: number, positive: string, negative: string): string {
  const total = Math.round(Math.abs(value) * 60);
  const degrees = Math.floor(total / 60);
  const minutes = total % 60;
  const hemisphere = total === 0 ? '' : value > 0 ? positive : negative;
  return `${degrees}°${String(minutes).padStart(2, '0')}′${hemisphere}`;
}

/** Latitude in degrees and minutes, e.g. `10°23′N` or `33°27′Z`. */
export const formatLat = (lat: number) => degreesMinutes(lat, 'N', 'Z');

/** Longitude in degrees and minutes, e.g. `4°54′O` or `75°31′W`. */
export const formatLng = (lng: number) => degreesMinutes(lng, 'O', 'W');

/** Both, e.g. `10°23′N 75°31′W`. */
export const formatLatLng = ({ lat, lng }: LatLng) => `${formatLat(lat)} ${formatLng(lng)}`;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in km (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Length of a route through the points in order, in km. */
export function routeKm(points: LatLng[]): number {
  return points.slice(1).reduce((sum, point, i) => sum + distanceKm(points[i], point), 0);
}

/** Whole km with a Dutch thousands separator, e.g. `9.710`. */
export const formatKm = (km: number) => Math.round(km).toLocaleString('nl-NL');
