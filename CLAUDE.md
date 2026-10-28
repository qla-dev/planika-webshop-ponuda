# Planika webshop ponuda

## Breakpointi (imena)

Kad korisnica u promptu kaže ime breakpointa, koristi tačno ovaj media query. Ne uvodi nove brojeve.

| Ime | Raspon | Media query |
|---|---|---|
| `mobitel` | do 540px | `@media(max-width:540px)` |
| `tablet` | 541–800px | `@media(max-width:800px)` |
| `laptop` | 801–1100px | `@media(max-width:1100px)` |
| `pc` | 1101–1599px | bez media queryja (osnovni stil) |
| `wide` | 1600px i više | `@media(min-width:1600px)` |

Projekt je desktop-first: osnovni stil je `pc`, a `max-width` pravila se nižu od većeg ka manjem (1100 → 800 → 540).

Kombinacije:
- "samo tablet" → `@media(min-width:541px) and (max-width:800px)`
- "samo laptop" → `@media(min-width:801px) and (max-width:1100px)`
- "tablet i mobitel" → `@media(max-width:800px)`
- "laptop i manje" → `@media(max-width:1100px)`
- "pc i wide" → `@media(min-width:1101px)`

## Fontovi

Drži se tipografije iz kartice "Type & Rhythm". Ne uvodi druge fontove (ni sistemske poput -apple-system ili Arial).

| Font | Za šta |
|---|---|
| `Manrope` | UI, filteri, cijene, statusi (dugmad, navigacija, tekst) |
| `DM Mono` | podaci, veličine, SKU, katalog (oznake, brojevi, meta redovi) |
| `Playfair Display` | naslovi |

Dugmad i polja moraju naslijediti font (`type-rules.css`), inače padaju na Arial.

## Git

Ne commitaj i ne pushaj dok korisnica to izričito ne traži. Izmjene ostavi necommitane.
