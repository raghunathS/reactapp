import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Box, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import ChartDataTable from './ChartDataTable';

interface ConfigRuleTrendChartProps {
  data: any[];
  configRules: string[];
  loading?: boolean;
}

const ConfigRuleTrendChart: React.FC<ConfigRuleTrendChartProps> = ({ data, configRules, loading }) => {
  if (loading || !data || data.length === 0) {
    return null;
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      zoom: { enabled: true },
    },
    xaxis: {
      type: 'category',
      categories: data.map(d => d.Month),
      title: {
        text: 'Month',
      },
    },
    yaxis: {
      title: {
        text: 'Ticket Count',
      },
    },
    stroke: {
      curve: 'smooth',
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    }
  };

  const chartSeries = [
    { name: 'Total', data: data.map(d => d.Total || 0) },
    ...configRules.map(rule => ({
      name: rule,
      data: data.map(d => d[rule] || 0),
    }))
  ];

  const columnDefinitions = [
    { id: 'Month', header: 'Month', cell: (item: any) => item.Month, sortingField: 'Month' },
    { id: 'Total', header: 'Total', cell: (item: any) => item.Total || 0, sortingField: 'Total' },
    ...configRules.map(rule => ({
      id: rule,
      header: rule,
      cell: (item: any) => item[rule] || 0,
      sortingField: rule,
    })),
  ];

  return (
    <Container header={<Header variant="h2">ConfigRule Monthly Ticket Trend</Header>}> 
      <SpaceBetween size="l">
        <Box padding={{ horizontal: 'm' }}>
          <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={350} />
        </Box>
        <ChartDataTable
          title="ConfigRule Trend Data"
          columnDefinitions={columnDefinitions}
          items={data}
          loading={loading}
        />
      </SpaceBetween>
    </Container>
  );
};

export default ConfigRuleTrendChart;
