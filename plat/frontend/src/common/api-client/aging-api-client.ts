import { API_ENDPOINT } from "../../config";
import { AgingFilterOptions, AgingRecord } from "../types";

export class AgingApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${API_ENDPOINT}/api`;
  }

  public async getFilterOptions(): Promise<AgingFilterOptions> {
    const response = await fetch(`${this.baseUrl}/aging-filter-options`);
    if (!response.ok) {
      throw new Error('Failed to fetch aging filter options');
    }
    return response.json();
  }

  public async getSummary(params: { [key: string]: string }): Promise<AgingRecord[]> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/aging-summary?${query}`);
    if (!response.ok) {
      throw new Error('Failed to fetch aging summary');
    }
    return response.json();
  }
}
