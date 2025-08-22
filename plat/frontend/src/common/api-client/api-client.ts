import { TicketsApiClient } from "./tickets-api-client";
import { AgingApiClient } from "./aging-api-client";

export class ApiClient {
  private _ticketsClient: TicketsApiClient;
  private _agingClient: AgingApiClient;

  constructor() {
    this._ticketsClient = new TicketsApiClient();
    this._agingClient = new AgingApiClient();
  }

  public get tickets(): TicketsApiClient {
    return this._ticketsClient;
  }

  public get aging(): AgingApiClient {
    return this._agingClient;
  }
}
