# 04 · Micro-animaties

**Als** lezer **wil ik** subtiele animaties bij laden, scrollen en interactie, **zodat** de site prettig en verzorgd aanvoelt zonder me op te houden.

## Acceptatiecriteria
- Hero-tekst en de eerste alinea's faden bij het laden kort in (≤ 300 ms, kleine verschuiving).
- Foto's in een post verschijnen met een fade plus kleine verschuiving van ~250 ms zodra ~10% in beeld is. Ze zijn nooit langer onzichtbaar dan nodig, en foto's die bij het laden al in beeld staan zijn direct zichtbaar of animeren meteen.
- Zonder JavaScript zijn alle foto's gewoon zichtbaar.
- Links, knoppen, pager-items en kaartmarkers hebben hover- en focus-transities van ~150 ms.
- Bij `prefers-reduced-motion: reduce` staan alle animaties uit en is alle content direct zichtbaar.
- Geen layout shift door de animaties (CLS gelijk aan nu).

## Buiten scope
- Paginatransities (zie 03).
- Animatie-libraries: gebruik CSS en waar nodig `IntersectionObserver` of scroll-driven animations.

## Agent notes
- Foto's worden gerenderd als `figure.photo` door `embedFlickrPhotos` in `src/lib/flickr.ts`. Zorg dat de PhotoSwipe-lightbox blijft werken.
- Bestaande reduced-motion-aanpak: `src/pages/index.astro` (pulse-animatie).
- Test met de posts uit 01.
