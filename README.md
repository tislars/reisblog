# Reisblog

Travel blog on a 3D globe. Astro static site on GitHub Pages; posts are written in Sveltia CMS (`/admin`), photos are hosted on Flickr.

## Writing a post

Open `https://tislars.github.io/reisblog/admin/`, sign in with a GitHub token and create a post. A place name ("Hoi An, Vietnam") is geocoded at build time via Nominatim; set `lat`/`lng` on the post if it lands in the wrong spot. To add a photo, paste its Flickr photo URL on its own line. The first photo is the cover unless `cover` is set. At most 30 photos per post (Flickr API terms). Saving publishes within a couple of minutes; tick "Concept" to keep a post offline.

## One-time setup

1. **Pages**: Settings → Pages → Source: *GitHub Actions*.
2. **Flickr**: request a non-commercial API key at <https://www.flickr.com/services/apps/create/> and add it as the repository secret `FLICKR_API_KEY`. Photos must be public.
3. **CMS login**: create a fine-grained token with *Contents: read and write* on this repository only, expiring after the trip. Use "Sign in with token" on `/admin`.
4. **Optional**: set `GOATCOUNTER_CODE` and `SUBSCRIBE_URL` (an RSS-to-email service pointed at `/reisblog/rss.xml`) in `src/config.ts`.

## Development

```sh
nvm use
npm ci
echo "FLICKR_API_KEY=..." > .env   # only needed for posts with photos
npm run dev
npm run validate                    # astro check + unit tests
```
