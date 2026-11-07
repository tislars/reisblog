# 01 · Realistische posts

**Als** maker van de reisblog **wil ik** posts met realistische lengte en opbouw, **zodat** ik het ontwerp en de leesbaarheid kan beoordelen met echte inhoud (demo).

## Acceptatiecriteria
- De 5 Colombia-posts (`bogota`, `salento`, `medellin`, `guatape`, `cartagena`) zijn herschreven naar 400–800 woorden lopende tekst (frontmatter en foto-URL's niet meegeteld).
- Elke post heeft minstens twee `##`-koppen en minstens één opsomming.
- Elke post heeft 2–4 Flickr-foto's verspreid door de tekst, niet allemaal onderaan; minstens één post bevat een fotorij (2–3 URL's op opeenvolgende regels).
- Verhaallijn, toon (Nederlands, ik/wij-perspectief, nuchter en concreet) en volgorde Bogotá → Cartagena blijven behouden. Feiten over de plekken kloppen.
- Alle 5 posts staan op `draft: false`.
- `src/content/posts/2026-11-06-voorbeeld.md` is verwijderd.
- Koppen en opsommingen in een post zijn netjes gestyled in de bestaande huisstijl.
- Maximaal 30 foto's per post (`MAX_PHOTOS_PER_PAGE`).

## Buiten scope
- Nieuwe posts of andere bestemmingen.
- Wijzigingen aan frontmatter-velden of het CMS.

## Agent notes
- Foto's: publieke Flickr-foto's van anderen zijn toegestaan (demo). Controleer elke URL: de build haalt hem op via de API met `FLICKR_API_KEY` (`.env`), en een foto die niet publiek is of niet bestaat breekt de build. Bestaande cover-URL's mag je laten staan.
- Fotosyntax en fotorijen: zie `src/lib/flickr.ts` en de hint in `public/admin/config.yml`. Zet een URL kaal op een eigen regel, niet als markdown-link.
- Het post-body-element is `article.body` in `src/pages/[year]/[month]/[slug].astro`; styles voor `h2`/`ul` ontbreken daar mogelijk nog.
- Check met `npm run build` en bekijk een post met `npm run dev`.
