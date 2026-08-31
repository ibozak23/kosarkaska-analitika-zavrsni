import { Component, computed, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";

const THEME_KEY = "kosarkaska-analitika-tema";

type Theme = "light" | "dark";

@Component({
  selector: "app-root",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app.html"
})
export class App {
  readonly theme = signal<Theme>(
    document.documentElement.dataset["theme"] === "dark" ? "dark" : "light"
  );

  readonly themeLabel = computed(() =>
    this.theme() === "dark" ? "Uključi svijetlu temu" : "Uključi tamnu temu"
  );

  toggleTheme(): void {
    const next: Theme = this.theme() === "dark" ? "light" : "dark";

    this.theme.set(next);
    document.documentElement.dataset["theme"] = next;
    localStorage.setItem(THEME_KEY, next);
  }
}
