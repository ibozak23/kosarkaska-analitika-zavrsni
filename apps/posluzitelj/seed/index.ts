import { pripremiServise } from "../src/sastavljanje-servisa.js";
import { otvoriBazu, dohvatiPutanjuBaze } from "../src/baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "../src/konfiguracija/ligaske-konstante.js";
import { spremiDemonstracijskePodatke } from "./punjenje.js";

const putanjaBaze = dohvatiPutanjuBaze();
const baza = otvoriBazu(putanjaBaze);
const servisi = pripremiServise(baza, DEMONSTRACIJSKE_LIGASKE_KONSTANTE);

// Prazna baza je uvjet
if (servisi.maticniPodaci.dohvatiTimove().length > 0) {
  console.log(`Baza ${putanjaBaze} već sadrži podatke, punjenje je preskočeno.`);
} else {
  const ishod = spremiDemonstracijskePodatke(servisi);

  console.log(`Baza ${putanjaBaze} napunjena: timova ${ishod.brojTimova}, igrača ${ishod.brojIgraca}, ` + `utakmica ${ishod.brojUtakmica}, događaja ${ishod.brojDogadjaja}.` );
}

baza.close();
