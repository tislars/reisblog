# 05 · Startstructuur voor een nieuwe post

**Als** schrijver **wil ik** dat een nieuwe post begint met een lichte opzet, **zodat** ik niet vanaf een leeg vel begin en toch alle vrijheid houd.

## Acceptatiecriteria
- Een nieuwe post in het CMS heeft als standaardtekst:
  ```
  Korte intro: waar ben je en hoe kwam je hier?

  ## Wat we deden

  ## Wat opviel

  ## Tips
  - 
  ```
- De hint van het veld **Tekst** bevat korte schrijfvragen (bijv. "Wat at je? Wat verraste je? Wat zou je een ander aanraden?") naast de bestaande foto-uitleg.
- Bestaande posts veranderen niet; de opzet geldt alleen voor nieuwe posts.
- Alle koppen en tekst mogen vrij worden aangepast of verwijderd. Er zijn geen verplichte secties en de build valideert niets extra's.

## Buiten scope
- AI-hulp of het automatisch genereren van tekst.
- Fotokiezer (zie 06).

## Agent notes
- `public/admin/config.yml`, veld `body` (markdown-widget, `default:`). Controleer in Sveltia (`npm run dev`, `/admin`) dat de default bij "Nieuwe post" verschijnt en dat de lege `- ` geen probleem geeft.
