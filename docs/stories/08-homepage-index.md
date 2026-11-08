# 08 · Homepage als index

**Als** lezer **wil ik** op de homepage in één oogopslag zien waar de reis nu is en alle dagen als inhoudsopgave, **zodat** ik snel een verhaal kies, ook als de kaart nog laadt.

Ontwerp: `docs/design/ontwerprichtingen.html`, richting **B**, pagina **Homepage**, desktop en mobiel.

## Acceptatiecriteria
- **Kopbalk** over de volle breedte, in Plex Mono, met een inktlijn eronder:
  - links `REISBLOG`;
  - midden een rode stip met "Dag {n} · nu in {plaats}" van de nieuwste post;
  - rechts de coördinaten van de nieuwste post (bijv. `10°23′N 75°31′W`). Die vervallen op mobiel.
- **Desktop:** twee kolommen.
  - Links de kop "Vier maanden onderweg, *post voor post* op de kaart." in Fraunces. Het cursieve deel is vermiljoen. Gebruik `SITE_DESCRIPTION` en markeer het accent in de config.
  - Daaronder de **index**: alle posts, nieuwste eerst. Elke rij heeft `DAG 09` (mono), de plaatsnaam (Fraunces), de breedtegraad (mono) en de titel (Newsreader, `--mute`).
  - Rechts de globe, met een legenda linksonder in mono: "{aantal} posts · {km} km · sleep om te draaien".
- **Mobiel (< 700px):** de globe bovenaan (± 300px hoog), daaronder de kop en de index. De index vervangt de horizontale tijdlijn; die vervalt.
- **Interactie:**
  - Hover of focus op een indexrij kleurt de plaatsnaam vermiljoen en markeert het bijbehorende punt op de globe.
  - Klik op een rij gaat naar de post. Het vliegen plus de previewkaart van nu vervallen, want de index is de navigatie.
  - Klik op een marker opent wel de bestaande previewkaart, in de nieuwe stijl.
  - De nieuwste post is in de index gemarkeerd (`aria-current`).
- **Afstand:** de km in de legenda is de som van de grootcirkelafstanden langs de route (thuis → post 1 → … → nieuwste), berekend bij de build in een geteste functie in `src/lib/`. Coördinaten zijn ook geformatteerd door een geteste functie (graden, minuten, N/Z en O/W).
- Zonder JavaScript of als de kaarttegels niet laden, blijft de index volledig bruikbaar.
- `npm run validate` slaagt.

## Buiten scope
- De postpagina (10).
- Paginering van de index. Dat is pas nodig bij heel veel posts; de lijst scrollt binnen de linkerkolom.

## Agent notes
- `src/pages/index.astro` (opmaak en styles) en `src/scripts/globe.ts` (`createPreview`, `bindEvents`, `data-fly`).
- `HOME` in `src/config.ts` is het startpunt van de route.
- In het ontwerp is "N/Z, O/W" Nederlands. Gebruik dat consequent.
