import type { Routes } from "@angular/router";

import { ZaslonAnalitikeUtakmice } from "./zasloni/zaslon-analitike-utakmice.js";
import { ZaslonDogadjajaUtakmice } from "./zasloni/zaslon-dogadjaja-utakmice.js";
import { ZaslonIgraca } from "./zasloni/zaslon-igraca.js";
import { ZaslonNadzornePloce } from "./zasloni/zaslon-nadzorne-ploce.js";
import { ZaslonTimova } from "./zasloni/zaslon-timova.js";
import { ZaslonUtakmica } from "./zasloni/zaslon-utakmica.js";
import { ZaslonUvozaUtakmice } from "./zasloni/zaslon-uvoza-utakmice.js";

export const routes: Routes = [
  { path: "", component: ZaslonNadzornePloce, title: "Nadzorna ploča" },
  { path: "timovi", component: ZaslonTimova, title: "Timovi" },
  { path: "igraci", component: ZaslonIgraca, title: "Igrači" },
  { path: "utakmice", component: ZaslonUtakmica, title: "Utakmice" },
  { path: "utakmice/:id/dogadjaji", component: ZaslonDogadjajaUtakmice, title: "Unos događaja" },
  { path: "utakmice/:id/analitika", component: ZaslonAnalitikeUtakmice, title: "Analitika utakmice" },
  { path: "uvoz", component: ZaslonUvozaUtakmice, title: "Uvoz utakmice" },
  { path: "**", redirectTo: "timovi" }
];
