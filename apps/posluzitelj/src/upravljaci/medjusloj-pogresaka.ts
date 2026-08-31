import type { NextFunction, Request, Response } from "express";

import { PogreskaNepostojecegZapisa, PogreskaProvjere } from "../pogreske/pogreske.js";

export function pretvoriPogreskuUOdgovor(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof PogreskaProvjere) {
    response.status(400).json({ poruka: error.message });
    return;
  }

  if (error instanceof PogreskaNepostojecegZapisa) {
    response.status(404).json({ poruka: error.message });
    return;
  }

  console.error(`Pogreška na ruti ${request.method} ${request.originalUrl}:`, error);
  response.status(500).json({ poruka: "Neočekivana pogreška poslužitelja." });
}
