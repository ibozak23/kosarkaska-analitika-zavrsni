# Programski okvir za košarkašku analitiku

Praktični dio završnog rada *Razvoj programskog okvira za odabranu domenu* (Ivan Božak, studij
Informacijski i poslovni sustavi). Repozitorij sadrži programski okvir objavljen na npm-u i
demonstracijsku aplikaciju koja dokazuje da je okvir upotrebljiv izvan vlastitih testova.

Javna adresa demonstracijske aplikacije: **<https://kosarkaska-analitika.onrender.com>**
Objavljeni paket: **[`@ibozak23/kosarkaska-analitika`](https://www.npmjs.com/package/@ibozak23/kosarkaska-analitika)**

## Što okvir radi

Okvir prima zapisnik utakmice — niz nepromjenjivih događaja s vremenom sa semafora — i iz njega
računa sedam statističkih pokazatelja. Ništa ne pohranjuje: pri svakom pozivu računa iznova iz
događaja, pa ispravak zapisnika odmah mijenja sve brojke.

| Pokazatelj | Razina | Kalkulator | Rezultat |
|---|---|---|---|
| Statistički list (engl. *box score*) | igrač | `PlayerBoxScoreCalculator` | `BoxScore` |
| Stvarna učinkovitost šuta (engl. *true shooting*) | igrač | `TrueShootingCalculator` | `number \| null` |
| Razlika koševa na terenu (engl. *plus/minus*) | igrač | `PlusMinusCalculator` | `number \| null` |
| Neprilagođeni PER (engl. *unadjusted PER*) | igrač | `PERCalculator` | `number \| null` |
| Tempo (engl. *pace*) | tim | `PaceCalculator` | `number \| null` |
| Ofenzivni pokazatelj (engl. *offensive rating*) | tim | `OffensiveRatingCalculator` | `number \| null` |
| Defenzivni pokazatelj (engl. *defensive rating*) | tim | `DefensiveRatingCalculator` | `number \| null` |

Okvir nema nijednu ovisnost i ne zna ništa o bazi podataka, mrežnom protokolu ni formatu datoteka.
Radi jednako u Node.js-u i u pregledniku.

## Brzi početak

Preduvjeti: **Node.js 24** (`package.json` traži ≥ 20.11.0, ali `render.yaml` i klijent postavljeni su
na 24) i **npm 10**.

```
git clone https://github.com/ibozak23/ZavrsniRad.git
cd ZavrsniRad
npm install
npm run build
npm test
```

Pokretanje cijele aplikacije lokalno, na adresi <http://localhost:3000>:

```
npm run seed -w apps/posluzitelj     # napuni bazu demonstracijskim podacima
npm start -w apps/posluzitelj        # poslužuje /api i izgrađenog klijenta
```

Za razvoj klijenta uz automatsko osvježavanje pokreću se dva procesa: poslužitelj naredbom iznad i
klijent naredbom `npm start -w apps/klijent` (adresa <http://localhost:4200>, zahtjevi prema `/api`
preusmjeravaju se posredovanjem iz `apps/klijent/proxy.conf.json`).

## Radni prostori

Repozitorij je monorepo s tri radna prostora `npm`. Aplikacija ovisi o **objavljenom paketu**, ne o
izvornom kodu okvira, pa se granica javnog sučelja provjerava na svakoj izgradnji.

| Radni prostor | Sadržaj | Ključne ovisnosti |
|---|---|---|
| `packages/okvir` | Programski okvir `@ibozak23/kosarkaska-analitika`: domenski modeli, hijerarhija događaja i analitički modul | nema |
| `apps/posluzitelj` | Poslužiteljska aplikacija: SQLite, repozitoriji, servisi i sučelje REST s 20 ruta | `express`, `better-sqlite3`, okvir |
| `apps/klijent` | Klijentska aplikacija u okviru Angular s pet zaslona | `@angular/*`, okvir |

## Naredbe

Sve se pokreće iz korijena repozitorija.

| Naredba | Učinak |
|---|---|
| `npm run build` | Prevodi sva tri radna prostora (`tsc`, odnosno `ng build` za klijenta) |
| `npm test` | Pokreće provjeru tipova nad testovima i Vitest u sva tri radna prostora |
| `npm run lint` | ESLint nad cijelim monorepoom |
| `npm start -w apps/posluzitelj` | Pokreće poslužitelj na `PORT` (zadano 3000) |
| `npm run seed -w apps/posluzitelj` | Puni bazu demonstracijskim podacima; preskače ako baza već ima timove |
| `npm start -w apps/klijent` | Razvojni poslužitelj Angulara na 4200 |
| `npm run test:coverage -w packages/okvir` | Pokrivenost okvira, prag ≥ 85 % za `src/analytics/**` |

Stanje testova nakon zadnje provjere: **okvir 66, poslužitelj 78, klijent 10** (ukupno 154).

## Postavke okoline

| Varijabla | Zadana vrijednost | Značenje |
|---|---|---|
| `PORT` | `3000` | Vrata na kojima poslužitelj sluša |
| `DATABASE_PATH` | `podaci/analitika.db` | Putanja do datoteke SQLite; vrijednost `:memory:` daje bazu u radnoj memoriji |

## Dokumentacija

| Dokument | Sadržaj |
|---|---|
| [`docs/arhitektura.md`](docs/arhitektura.md) | Slojevi, tok podataka od unosa događaja do pokazatelja, model vremena, granice ovisnosti |
| [`docs/okvir-api.md`](docs/okvir-api.md) | Referenca javnog sučelja okvira: svaki izvezeni tip i razred, pravila za `null`, pisanje vlastitog kalkulatora |
| [`docs/rest-api.md`](docs/rest-api.md) | Svih 20 ruta sučelja REST s tijelima zahtjeva, odgovorima i pogreškama |
| [`docs/razvoj.md`](docs/razvoj.md) | Vodič za razvoj: struktura, postavke prevoditelja, testovi, uobičajene izmjene, postavljanje |

## Licencija

Paket `packages/okvir` objavljen je pod licencijom MIT (`packages/okvir/LICENSE`). Demonstracijske
aplikacije dio su završnog rada i nisu zasebno licencirane.
