# 03 · Paginatransities

**Als** lezer **wil ik** vloeiende overgangen tussen de kaart en posts en tussen posts onderling, **zodat** de site als één geheel aanvoelt.

## Acceptatiecriteria
- Cross-document View Transitions (`@view-transition { navigation: auto; }`) staan aan voor alle pagina's. De site blijft een MPA zonder client-side router.
- Kaart → post, post → post (pager) en post → kaart krijgen een subtiele overgang van ~300 ms, bijvoorbeeld een crossfade; waar het natuurlijk is morpht de coverfoto van de pager-thumbnail naar de hero (`view-transition-name`).
- Bij terugkomst op de kaart via `/?post=...` vliegt de globe vloeiend naar de post, zonder harde sprong.
- Browsers zonder View Transitions navigeren gewoon zonder animatie, zonder fouten.
- Bij `prefers-reduced-motion: reduce` zijn er geen transities en springt de globe direct.

## Buiten scope
- Animaties binnen een pagina (zie 04).
- Een SPA of Astro `<ClientRouter />`.

## Agent notes
- Layout: `src/layouts/Base.astro`. Globe: `src/scripts/globe.ts` (`flyTo`, de `saved`/`focus`-logica rond regel 160 en 263).
- Vermijd dubbele `view-transition-name`s op één pagina; die breken de transitie.
