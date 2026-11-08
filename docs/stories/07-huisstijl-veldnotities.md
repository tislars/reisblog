# 07 · Huisstijl Veldnotities

**Als** maker van de reisblog **wil ik** de huisstijl van richting B "Veldnotities" als basis in de code, **zodat** de homepage (08), feiten (09) en postpagina (10) daarop kunnen voortbouwen.

Ontwerp: `docs/design/ontwerprichtingen.html`, richting **B · Veldnotities**. Open het in een browser: alleen daar laden de Flickr-foto's en lettertypes.

## Acceptatiecriteria
- De kleur-tokens in `src/styles/global.css` zijn vervangen door de B-tokens. Eén thema, licht. Het donkere thema (`data-theme='dark'`) vervalt.

  | Token | Waarde | Gebruik |
  |---|---|---|
  | `--paper` | `#f3eee4` | achtergrond |
  | `--ink` | `#1b1f1a` | tekst, lijnen van de globe, scheidingslijnen tussen secties |
  | `--mute` | `#6d6a60` | secundaire tekst (4,7:1 op papier) |
  | `--line` | `#d8d0bf` | dunne scheidingslijnen |
  | `--land` | `#e3dac7` | land op de globe |
  | `--verm` | `#e0442b` | accent: route, markers, grote koppen, opsommingstekens |
  | `--verm-tekst` | `#c2381f` | accent in **kleine** tekst (4,7:1); `--verm` haalt maar 3,6:1 en mag alleen op tekst ≥ 24px of als grafisch element |

- Lettertypes via Google Fonts, met zo min mogelijk gewichten:
  - **Fraunces** voor koppen en plaatsnamen (opsz, 400–500, cursief voor het accent in de homepagekop);
  - **Newsreader** blijft voor lopende tekst;
  - **IBM Plex Mono** (400, 500) voor meta: dagnummers, datums, coördinaten, labels, bijschriften.
- `ACCENT` in `src/config.ts` wordt `#e0442b`.
- De globe (MapLibre blijft) krijgt de lijnstijl uit het ontwerp:
  - zee in papierkleur;
  - land in `--land` met een dunne inktlijn langs de kust. OpenFreeMap heeft geen kustlijnlaag, dus gebruik een `line`-laag op de `water`-bronlaag;
  - een gradennet (graticule) als GeoJSON-lijnlaag in `--line`, in code gegenereerd elke 10°;
  - de rand van de bol als inktlijn;
  - de route doorgetrokken (niet gestippeld) in `--verm`;
  - markers als papierkleurige cirkels met een vermiljoen rand. Het nieuwste punt is een gevulde cirkel met het dagnummer erin, in Plex Mono.
- De regels uit `src/lib/mapstyle.ts` (wegen vanaf zoom 8, labels vanaf zoom 4) blijven gelden. Nieuwe stijlregels komen daar ook, met tests.
- Alle tekst haalt WCAG AA. Focus-ringen zijn zichtbaar op papier (`--ink`, 2px).
- `npm run validate` slaagt.

## Buiten scope
- De opbouw van homepage en postpagina (08 en 10).
- Het CMS (`public/admin`), behalve als de preview daar breekt door de nieuwe tokens.

## Agent notes
- Huidige tokens: `src/styles/global.css`. Kaartstijl: `restyle()` en `addLayers()` in `src/scripts/globe.ts`, regels in `src/lib/mapstyle.ts`.
- Laagnamen in de OpenFreeMap-stijl `dark` (bijv. `water`, `boundary_country_z0-4`, `highway_*`) staan in de stijl-JSON op `https://tiles.openfreemap.org/styles/dark`. Overweeg de stijl `positron` als basis: die is licht en vraagt minder overschrijvingen.
- Houd `prefers-reduced-motion` intact (pulse-animatie, view transitions).
