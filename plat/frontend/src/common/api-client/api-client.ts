import { TicketsApiClient } from "./tickets-api-client";

export class ApiClient {
  private _ticketsClient: TicketsApiClient;

  constructor() {
    this._ticketsClient = new TicketsApiClient();
  }

  public get tickets(): TicketsApiClient {
    return this._ticketsClient;
  }
}
