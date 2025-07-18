import { ComponentType } from 'react';
import StatisticsCards from '../../pages/dashboard/statistics-cards';
import TicketsTable from '../../pages/dashboard/tickets/tickets-table';
import HeartbeatChart from '../../pages/dashboard/HeartbeatChart';
import AwsTicketsByMonthChart from '../../pages/dashboard/tickets/AwsTicketsByMonthChart';
import GcpTicketsByMonthChart from '../../pages/dashboard/tickets/GcpTicketsByMonthChart';
import AwsTicketsDataTable from '../../pages/dashboard/tickets/AwsTicketsDataTable';
import GcpTicketsDataTable from '../../pages/dashboard/tickets/GcpTicketsDataTable';

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  component: ComponentType<any>;
  defaultConfig?: Record<string, any>;
  defaultSize?: { colspan: number; rowspan: number };
}

// A registry of all available widgets for the dashboard.
export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  statistics: {
    id: 'statistics',
    title: 'Ticket Statistics',
    description: 'Key statistics for AWS and GCP tickets.',
    component: StatisticsCards,
    defaultSize: { colspan: 12, rowspan: 1 },
  },
  awsTicketsByMonthChart: {
    id: 'awsTicketsByMonthChart',
    title: 'AWS Tickets by Month',
    description: 'Monthly stacked bar chart of AWS tickets by environment.',
    component: AwsTicketsByMonthChart,
    defaultSize: { colspan: 6, rowspan: 2 },
  },
  gcpTicketsByMonthChart: {
    id: 'gcpTicketsByMonthChart',
    title: 'GCP Tickets by Month',
    description: 'Monthly stacked bar chart of GCP tickets by environment.',
    component: GcpTicketsByMonthChart,
    defaultSize: { colspan: 6, rowspan: 2 },
  },
  awsTicketsDataTable: {
    id: 'awsTicketsDataTable',
    title: 'AWS Tickets Data',
    description: 'Monthly data table of AWS tickets by environment.',
    component: AwsTicketsDataTable,
    defaultSize: { colspan: 6, rowspan: 2 },
  },
  gcpTicketsDataTable: {
    id: 'gcpTicketsDataTable',
    title: 'GCP Tickets Data',
    description: 'Monthly data table of GCP tickets by environment.',
    component: GcpTicketsDataTable,
    defaultSize: { colspan: 6, rowspan: 2 },
  },
  awsHeartbeat: {
    id: 'awsHeartbeat',
    title: 'AWS Heartbeat Status',
    description: 'Pipeline health status for AWS.',
    component: HeartbeatChart,
    defaultConfig: { csp: 'aws', title: 'AWS Heartbeat Status' },
    defaultSize: { colspan: 6, rowspan: 2 },
  },
  gcpHeartbeat: {
    id: 'gcpHeartbeat',
    title: 'GCP Heartbeat Status',
    description: 'Pipeline health status for GCP.',
    component: HeartbeatChart,
    defaultConfig: { csp: 'gcp', title: 'GCP Heartbeat Status' },
    defaultSize: { colspan: 6, rowspan: 2 },
  },
  ticketsTable: {
    id: 'ticketsTable',
    title: 'All Tickets',
    description: 'A detailed, filterable table of all tickets.',
    component: TicketsTable,
    defaultSize: { colspan: 12, rowspan: 3 },
  },
};
