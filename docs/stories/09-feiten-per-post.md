# 09 · Feiten per post

**Als** schrijver **wil ik** per post zelf een paar korte feiten invullen (bijv. "Aankomst: 8 uur bus", "Hoogte: 1.495 m"), **zodat** de lezer in één blik de context van die dag ziet. Welke en hoeveel feiten het zijn verschilt per post.

## Acceptatiecriteria
- Frontmatter-veld `facts`: een optionele lijst van `{ label, value }`.
  - **0 tot 6** feiten. Bij 0 verschijnt er geen feitenrij.
  - `label`: verplicht, 1–20 tekens (bijv. "Aankomst", "Temperatuur", "Gelopen").
  - `value`: verplicht, 1–30 tekens (bijv. "8 uur bus", "±25°", "14 km").
  - Geen vaste lijst van labels: elke post kiest zijn eigen.
- Schema in `src/content.config.ts` (zod) valideert dit. Een te lang label of meer dan 6 feiten laat de build falen met een duidelijke melding.
- **CMS** (`public/admin/config.yml`): een veld **Feiten (optioneel)** van het type `list`, met subvelden **Label** en **Waarde**.
  - Je kunt feiten toevoegen, verwijderen en verslepen. De volgorde in het CMS is de volgorde op de site.
  - De hint geeft voorbeelden en noemt het maximum van 6.
  - Bestaande posts zonder `facts` blijven werken, zonder migratie.
- Het **renderen** van de feitenrij hoort bij story 10. Deze story levert het veld, de validatie en een getypte toegang (`post.entry.data.facts`).
- De vijf Colombia-demoposts krijgen elk 2–4 feiten, zodat 10 met variatie getest kan worden. Feiten uit de tekst, niet verzonnen.
  - Bogotá: Hoogte 2.600 m, Aankomst 20.30 uur, Monserrate 3.150 m, Ajiaco < € 5.
  - Medellín: Aankomst 8 uur bus, Temperatuur ±25°.
  - Guatapé: Treden 740, Hoogte rots ruim 200 m.
  - De Schiphol-post blijft zonder feiten.
- `npm run validate` slaagt.

## Buiten scope
- Berekende feiten (afstand vanaf thuis, dagnummer). Die staan al elders op de pagina.
- Iconen bij feiten.

## Agent notes
- Sveltia CMS ondersteunt `widget: list` met `fields`. Test in `npm run dev` op `/admin` dat toevoegen, verslepen en leeg laten goed gaan, en dat de frontmatter als nette YAML-lijst wordt weggeschreven.
- Gebruik `z.array(z.object({ label: z.string().min(1).max(20), value: z.string().min(1).max(30) })).max(6).default([])`.
