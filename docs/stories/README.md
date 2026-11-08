# Stories

Werk ze op volgorde af, één story per branch (`feature/<slug>`) en per PR. Een story is klaar als alle acceptatiecriteria gehaald zijn, `npm run validate` slaagt en de PR openstaat.

| # | Story | Branch |
|---|-------|--------|
| 01 | [Realistische posts](01-realistische-posts.md) | `feature/realistische-posts` |
| 02 | [Duidelijke terugknop](02-terugknop.md) | `feature/terug-knop` |
| 03 | [Paginatransities](03-paginatransities.md) | `feature/pagina-transities` |
| 04 | [Micro-animaties](04-micro-animaties.md) | `feature/micro-animaties` |
| 05 | [Startstructuur nieuwe post](05-startstructuur-post.md) | `feature/post-startstructuur` |
| 06 | [Flickr-fotokiezer](06-flickr-fotokiezer.md) | `feature/flickr-fotokiezer` |
| 07 | [Huisstijl Veldnotities](07-huisstijl-veldnotities.md) | `feature/huisstijl-veldnotities` |
| 08 | [Homepage als index](08-homepage-index.md) | `feature/homepage-index` |
| 09 | [Feiten per post](09-feiten-per-post.md) | `feature/feiten-per-post` |
| 10 | [Postpagina als veldnotitie](10-postpagina-veldnotitie.md) | `feature/postpagina-veldnotitie` |

Algemene animatieregels (03, 04): hover/focus ~150 ms, foto-reveal ~250 ms, paginatransities ~300 ms. Bij `prefers-reduced-motion: reduce` staat alles uit.

Redesign (07–10): het ontwerp staat in [`docs/design/ontwerprichtingen.html`](../design/ontwerprichtingen.html), richting **B · Veldnotities**. Open het in een browser; 07 eerst, 09 vóór 10.
