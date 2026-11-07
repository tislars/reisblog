# 02 · Duidelijke knop "Terug naar de kaart"

**Als** lezer **wil ik** vanaf elke plek in een post direct de knop terug naar de kaart zien, **zodat** ik niet hoef te zoeken of terug te scrollen.

## Acceptatiecriteria
- "Terug naar de kaart" is een pill-vormige knop met een eigen achtergrond en een icoon (pijl of globe, inline SVG).
- Het contrast is minimaal WCAG AA (4,5:1) op elke cover: lichte foto, donkere foto en een post zonder cover.
- De knop blijft in beeld tijdens het scrollen (sticky/fixed linksboven) en bedekt de tekst niet hinderlijk, ook op mobiel (360 px breed).
- Hover- en focusstaat zijn zichtbaar, met een duidelijke focus-ring voor toetsenbordgebruik.
- De link-URL blijft `globeLink` (`/?post=...`), zodat de kaart op de post terugkeert.

## Buiten scope
- Animatie bij het teruggaan (zie 03).
- Andere navigatie zoals de pager.

## Agent notes
- `src/pages/[year]/[month]/[slug].astro`, `nav.top`. Gebruik de bestaande kleur-tokens/`ACCENT` uit `src/config.ts` en `src/styles/global.css`.
