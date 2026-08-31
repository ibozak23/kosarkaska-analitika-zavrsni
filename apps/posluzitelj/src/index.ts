import { pripremiServise } from "./sastavljanje-servisa.js";
import { otvoriBazu, dohvatiPutanjuBaze } from "./baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "./konfiguracija/ligaske-konstante.js";
import { pripremiAplikaciju } from "./upravljaci/sastavljanje-aplikacije.js";
import { dohvatiPutanjuKlijenta } from "./upravljaci/posluzivanje-klijenta.js";

const DEFAULT_PORT = 3000;

const port = Number(process.env["PORT"] ?? DEFAULT_PORT);
const putanjaBaze = dohvatiPutanjuBaze();
const servisi = pripremiServise(otvoriBazu(putanjaBaze), DEMONSTRACIJSKE_LIGASKE_KONSTANTE);
const app = pripremiAplikaciju(servisi, dohvatiPutanjuKlijenta());

app.listen(port, () => {
  console.log(`Poslužitelj sluša na http://localhost:${port}, baza: ${putanjaBaze}`);
});
