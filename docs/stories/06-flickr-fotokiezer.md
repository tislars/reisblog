# 06 · Flickr-fotokiezer in het CMS

**Als** schrijver **wil ik** in het CMS door mijn eigen Flickr-foto's bladeren en ze aanklikken, **zodat** ik geen URL's meer hoef op te zoeken en te plakken.

## Acceptatiecriteria
- Bij het eerste gebruik vraagt de kiezer om de Flickr API-key en bewaart die in `localStorage`. De key staat nooit in de repo of in `public/`. Er is een manier om de key te wijzigen of te wissen.
- Zonder key of bij een ongeldige key toont de kiezer een duidelijke melding in plaats van een fout.
- De kiezer toont de publieke foto's van gebruiker `191583412@N04` (larsh1991) als thumbnail-raster, nieuwste eerst, met paginering of "meer laden", en kan filteren op album.
- In de teksteditor zit een knop "Foto invoegen":
  - 1 foto gekozen → de foto-URL op een eigen regel;
  - 2 of 3 foto's gekozen → een fotorij (URL's op opeenvolgende regels, zelfde formaat als de bestaande component "Foto's naast elkaar");
  - meer dan 3 foto's kiezen kan niet.
- Het veld **Coverfoto** heeft dezelfde kiezer (1 foto) en blijft ook met de hand invulbaar.
- De ingevoegde URL's worden door de bestaande build herkend (`parseFlickrRef` in `src/lib/flickr.ts`) en tonen correct op de site.
- URL's plakken met de hand blijft werken.

## Handmatige stap
- Lars vult in de kiezer zijn bestaande Flickr API-key in (dezelfde als het GitHub-secret `FLICKR_API_KEY`; een tweede key vereist Flickr Pro).

## Buiten scope
- Foto's uploaden naar Flickr.
- Foto's van andere gebruikers.
- Een server of proxy.

## Agent notes
- Eerste controle: kan `api.flickr.com/services/rest/` vanuit de browser met CORS (`format=json&nojsoncallback=1`)? Zo niet, gebruik JSONP (`jsoncallback`).
- API-calls: `flickr.people.getPublicPhotos`, `flickr.photosets.getList`, `flickr.photosets.getPhotos` (met `extras=url_q`).
- Sveltia: `CMS.registerEditorComponent` (bestaand voorbeeld in `public/admin/index.html`) en `CMS.registerWidget`/`registerFieldType` voor het cover-veld. Pin de bestaande Sveltia-versie; check de API op https://sveltiacms.app/en/docs/api/field-types.
- Houd alle code in `public/admin/` (eventueel een apart `.js`-bestand); geen build-stap of nieuwe dependency.
- Zonder key kan de agent het eind-tot-eind niet testen: test de rendering met een gemockte API-response en documenteer in de PR wat Lars nog met de echte key moet controleren.
