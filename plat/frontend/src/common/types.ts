
export interface NavigationPanelState {
  collapsed?: boolean;
  collapsedSections?: Record<number, boolean>;
}

export interface Ticket {
  CSP: string;
  Environment: string;
  NarrowEnvironment: string;
  AlertType: string;
  Priority: string;
  Key: string;
  AppCode: string;
  ConfigRule: string;
  Summary: string;
  Account: string;
  tCreated: string;
  tResolved: string;
  TimeToResolve: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  total_count: number;
}

// Represents a single month's data for the environment summary chart.
export interface MonthlyEnvChartItem {
  Month: string;
  // Dynamically includes counts for each environment, e.g., { PROD: 10, Dev: 5, Uat: 8 }
  [environment: string]: number | string;
}

export interface CSPStatistics {
  total_tickets: number;
  monthly_average: number;
}

// The overall shape of the /api/environment-summary response.
export interface EnvironmentSummaryResponse {
  aws: MonthlyEnvChartItem[];
  gcp: MonthlyEnvChartItem[];
  aws_stats: CSPStatistics;
  gcp_stats: CSPStatistics;
}
