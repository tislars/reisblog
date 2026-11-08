# 10 · Postpagina als veldnotitie

**Als** lezer **wil ik** een post die opent als een veldnotitie, met plek, datum en feiten, en daarna grote foto's en een rustige tekstkolom, **zodat** lange verhalen prettig lezen en elke dag een eigen karakter heeft.

Ontwerp: `docs/design/ontwerprichtingen.html`, richting **B**, pagina **Post**, desktop en mobiel.

## Acceptatiecriteria
- **Kopregel** in mono met een inktlijn eronder: "← Kaart" (link naar `globeLink`), `DAG 06 / ±120` en de datum. De datum vervalt op mobiel.
  - Het totaal aantal dagen komt uit een nieuwe config-waarde, bijv. `TRIP_DAYS = 120`.
  - De bestaande zwevende terugknop (story 02) vervalt. De kopregel neemt die rol over en blijft sticky bovenaan bij scrollen, zodat aan story 02 voldaan blijft.
- **Kop:**
  - de stempelregel in mono, in `--verm-tekst`: "MEDELLÍN, COLOMBIA — 6°15′N 75°34′W";
  - daaronder de titel groot in Fraunces (desktop ~96px, mobiel ~48px, `text-wrap: balance`).
- **Inleiding:** de eerste alinea van de tekst wordt groter weergegeven (Newsreader, ~26px; mobiel ~21px), direct onder de titel.
- **Feitenrij** (uit 09):
  - een raster met dunne lijnen; label in mono, waarde in Fraunces;
  - het aantal kolommen volgt het aantal feiten: 1–4 op één rij, 5–6 verdeeld over twee rijen;
  - op mobiel altijd 2 kolommen;
  - geen feiten → geen rij en geen lege ruimte.
- **Coverfoto:**
  - na de feitenrij, binnen de paginabreedte (max. ~1100px), niet over het hele scherm;
  - verhouding 16:9, op mobiel 4:3 en tot de schermrand;
  - bijschrift in mono: "FIG. 1" in vermiljoen plus het bijschrift.
- **Tekst:**
  - een kolom van max. 38rem;
  - `##`-koppen in Fraunces met een volgnummer in mono ervoor (`01`, `02`, …), automatisch op volgorde;
  - opsommingen met een vermiljoen streepje en dunne lijnen tussen de items.
- **Foto's in de tekst:**
  - een losse foto krijgt de volle paginabreedte;
  - een fotorij (2–3) staat naast elkaar, rechthoekig bijgesneden (bijv. 4:5) met een kleine tussenruimte;
  - bijschriften in mono, genummerd vanaf FIG. 2;
  - PhotoSwipe en `srcset` blijven werken.
- **Volgende post:** een inktlijn met daaronder "VOLGENDE · DAG 07" (mono) en de plaats en titel groot in Fraunces. Rechts staat een kleine globe (± 200px) met de route en de volgende stop gemarkeerd; op mobiel ± 110px. Deze mini-globe mag een statische SVG zijn die bij de build wordt gegenereerd (bijv. met `d3-geo` en `world-atlas`), zodat er geen tweede MapLibre-kaart nodig is.
- Reacties (Giscus, als ingesteld) staan tussen de tekst en de volgende post, in de nieuwe stijl, met `data-theme` passend bij papier.
- View transitions (story 03) en de foto-animaties (story 04) blijven werken, ook met `prefers-reduced-motion`.
- `npm run validate` slaagt.

## Buiten scope
- Nieuwe frontmatter-velden behalve `facts` (09).
- Een vorige-knop in dezelfde stijl. "Vorige" mag blijven als eenvoudige tekstlink.

## Agent notes
- `src/pages/[year]/[month]/[slug].astro`. Foto-HTML komt uit `embedFlickrPhotos` in `src/lib/flickr.ts`. Nummering van FIG. kan daar, getest, of met CSS-counters.
- De inleiding los maken: CSS `.body > p:first-of-type` is het eenvoudigst. Geen aparte frontmatter.
- Coördinaten-formatter komt uit 08 (`src/lib/`).
- Test met de Colombia-posts uit 01 en de feiten uit 09: een post met 2 feiten (Medellín), een met 4 (Bogotá) en de Schiphol-post zonder feiten. Test 5–6 feiten met een tijdelijke conceptpost.
