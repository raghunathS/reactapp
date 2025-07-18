import { TicketsResponse, EnvironmentSummaryResponse } from '../types';

const API_BASE_URL = '/api';

export class TicketsApiClient {
  public async getTickets(params: {
    page: number;
    size: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    filteringQuery?: Record<string, any>;
    year?: number;
  }): Promise<TicketsResponse> {
    const { page, size, sortBy, sortOrder, filteringQuery, year } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (year) {
      queryParams.append('year', year.toString());
    }

    if (filteringQuery) {
      // The backend expects each filter as a separate query parameter (e.g., Status=Open, Priority=High)
      Object.keys(filteringQuery).forEach(key => {
        const value = filteringQuery[key];
        if (value) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/tickets?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tickets');
    }
    return response.json();
  }

  public async getTicketFilterOptions(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tickets-filter-options`);
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    return response.json();
  }

  public async downloadTicketsCsv(params: {
    filteringQuery?: Record<string, any>;
  }): Promise<Blob> {
    const { filteringQuery } = params;
    const queryParams = new URLSearchParams();

    if (filteringQuery) {
      // The backend expects each filter as a separate query parameter (e.g., Status=Open, Priority=High)
      Object.keys(filteringQuery).forEach(key => {
        const value = filteringQuery[key];
        if (value) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/tickets/download?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to download CSV');
    }
    return response.blob();
  }

  public async getEnvironmentSummary(year?: number, environment?: string, narrowEnvironment?: string): Promise<EnvironmentSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (year) {
      queryParams.append('year', year.toString());
    }
    if (environment && environment !== 'All') {
      queryParams.append('environment', environment);
    }
    if (narrowEnvironment && narrowEnvironment !== 'All') {
      queryParams.append('narrow_environment', narrowEnvironment);
    }

    const response = await fetch(`${API_BASE_URL}/environment-summary?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch environment summary');
    }
    return response.json();
  }
}
