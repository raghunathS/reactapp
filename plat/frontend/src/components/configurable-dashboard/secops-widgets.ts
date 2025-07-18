import { ComponentType } from 'react';
import TicketCountChartWidget from '../reports/TicketCountChartWidget';
import TicketCountTableWidget from '../reports/TicketCountTableWidget';
import ControlCountChartWidget from '../reports/ControlCountChartWidget';
import ControlCountTableWidget from '../reports/ControlCountTableWidget';
import HeatmapChartWidget from '../reports/HeatmapChartWidget';
import HeatmapTableWidget from '../reports/HeatmapTableWidget';
import CSPStatisticsWidget from '../reports/CSPStatisticsWidget';

export interface SecOpsWidgetDefinition {
  id: string;
  title: string;
  description: string;
  component: ComponentType<any>;
  defaultSize: { colspan: number; rowspan: number };
  defaultConfig?: any;
}

export const SECOPS_WIDGET_REGISTRY: Record<string, SecOpsWidgetDefinition> = {
  statistics: {
    id: 'statistics',
    title: 'Ticket Statistics',
    description: 'Key ticket statistics for the selected CSP.',
    component: CSPStatisticsWidget,
    defaultSize: { colspan: 12, rowspan: 1 },
  },
  ticketCountChart: {
    id: 'ticketCountChart',
    title: 'Ticket Count by AppCode (Chart)',
    description: 'Monthly stacked bar chart of tickets by AppCode.',
    component: TicketCountChartWidget,
    defaultSize: { colspan: 12, rowspan: 2 },
  },
  ticketCountTable: {
    id: 'ticketCountTable',
    title: 'Ticket Count by AppCode (Table)',
    description: 'Data table for monthly ticket counts by AppCode.',
    component: TicketCountTableWidget,
    defaultSize: { colspan: 12, rowspan: 2 },
  },
  controlCountChart: {
    id: 'controlCountChart',
    title: 'Control Count by AppCode (Chart)',
    description: 'Stacked bar chart of control failures by AppCode.',
    component: ControlCountChartWidget,
    defaultSize: { colspan: 12, rowspan: 2 },
  },
  controlCountTable: {
    id: 'controlCountTable',
    title: 'Control Count by AppCode (Table)',
    description: 'Data table for control failures by AppCode.',
    component: ControlCountTableWidget,
    defaultSize: { colspan: 12, rowspan: 2 },
  },
  heatmapChart: {
    id: 'heatmapChart',
    title: 'Heatmap: AppCode vs. ConfigRule',
    description: 'Heatmap showing the density of issues between AppCodes and ConfigRules.',
    component: HeatmapChartWidget,
    defaultSize: { colspan: 12, rowspan: 3 },
  },
  heatmapTable: {
    id: 'heatmapTable',
    title: 'Heatmap Data Table',
    description: 'Data table for the AppCode vs. ConfigRule heatmap.',
    component: HeatmapTableWidget,
    defaultSize: { colspan: 12, rowspan: 2 },
  },
};
