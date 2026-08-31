import { describe, expect, it } from "vitest";

import { routes } from "../src/app/app.routes.js";
import { ZaslonAnalitikeUtakmice } from "../src/app/zasloni/zaslon-analitike-utakmice.js";
import { ZaslonDogadjajaUtakmice } from "../src/app/zasloni/zaslon-dogadjaja-utakmice.js";
import { ZaslonNadzornePloce } from "../src/app/zasloni/zaslon-nadzorne-ploce.js";
import { ZaslonUtakmica } from "../src/app/zasloni/zaslon-utakmica.js";
import { ZaslonIgraca } from "../src/app/zasloni/zaslon-igraca.js";
import { ZaslonTimova } from "../src/app/zasloni/zaslon-timova.js";

describe("usmjeravanje", () => {
  it("vodi na šest zaslona", () => {
    const zasloni = [
      { path: "", component: ZaslonNadzornePloce },
      { path: "timovi", component: ZaslonTimova },
      { path: "igraci", component: ZaslonIgraca },
      { path: "utakmice", component: ZaslonUtakmica },
      { path: "utakmice/:id/dogadjaji", component: ZaslonDogadjajaUtakmice },
      { path: "utakmice/:id/analitika", component: ZaslonAnalitikeUtakmice }
    ];

    for (const zaslon of zasloni) {
      const ruta = routes.find((kandidat) => kandidat.path === zaslon.path);

      expect(ruta?.component).toBe(zaslon.component);
    }

    expect(routes.filter((ruta) => ruta.component !== undefined)).toHaveLength(zasloni.length);
  });

  it("s nepoznate putanje vodi na popis timova", () => {
    expect(routes.find((ruta) => ruta.path === "**")?.redirectTo).toBe("timovi");
  });
});
