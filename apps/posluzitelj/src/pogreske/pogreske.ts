// Podatak koji je stigao nije valjan
export class PogreskaProvjere extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PogreskaProvjere";
  }
}

// Traženog zapisa nema u bazi.
export class PogreskaNepostojecegZapisa extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PogreskaNepostojecegZapisa";
  }
}
