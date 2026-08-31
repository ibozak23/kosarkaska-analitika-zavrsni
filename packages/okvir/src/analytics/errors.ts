export class InvalidEventSequenceError extends Error {
  readonly playerId: number;
  readonly eventId: number;

  constructor(message: string, playerId: number, eventId: number) {
    super(message);
    this.name = "InvalidEventSequenceError";
    this.playerId = playerId;
    this.eventId = eventId;
  }
}
