import ReactApexChart from 'react-apexcharts';
import { Box, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import ChartDataTable from './ChartDataTable';

const MonthlyAppCodeHeatmap = ({ data, appCodes, loading }: { data: any[], appCodes: string[], loading?: boolean }) => {
  if (!data || data.length === 0) {
    return null; // Don't render anything if there's no data
  }

  const chartSeries = appCodes.map(code => ({
    name: code,
    data: data.map(row => ({
      x: row.Month,
      y: row[code]
    }))
  }));

    const allValues = data.flatMap(row => appCodes.map(code => row[code] || 0)).filter(v => v > 0);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  const midPoint = maxValue / 2;

  const coolwarmRanges = () => {
    if (maxValue === 0) {
        return [{
            from: 0,
            to: 0,
            name: '0',
            color: '#f9f9f9'
        }];
    }

    return [
        {
            from: 0,
            to: 0,
            name: '0',
            color: '#f9f9f9'
        },
        {
            from: 1,
            to: Math.max(1, midPoint / 2),
            name: 'low',
            color: '#5A8DEE'
        },
        {
            from: Math.max(1, midPoint / 2) + 1,
            to: midPoint,
            name: 'medium-low',
            color: '#AAB6FF'
        },
        {
            from: midPoint + 1,
            to: midPoint + (maxValue - midPoint) / 2,
            name: 'medium-high',
            color: '#FF8A80'
        },
        {
            from: midPoint + (maxValue - midPoint) / 2 + 1,
            to: maxValue,
            name: 'high',
            color: '#FF5252'
        }
    ];
  };

  const chartOptions = {
    chart: {
      id: 'monthly-appcode-heatmap',
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.7,
        colorScale: {
          ranges: coolwarmRanges()
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#000000']
      }
    },
    title: {
      text: 'Monthly Ticket Heatmap by AppCode',
      align: 'left' as 'left'
    },
  };

    const columnDefinitions = [
    { id: 'month', header: 'Month', cell: (item: any) => item.Month, sortingField: 'Month' },
    ...appCodes.map(code => ({
      id: code,
      header: code,
      cell: (item: any) => item[code] || 0,
      sortingField: code,
    })),
  ];

  return (
    <Container header={<Header variant="h2">Monthly Tickets by AppCode</Header>}>
      <SpaceBetween size="l">
        <Box padding={{ horizontal: 'm' }}>
            <ReactApexChart options={chartOptions} series={chartSeries} type="heatmap" height={350} />
        </Box>
        <ChartDataTable
            title="Monthly Heatmap Data"
            columnDefinitions={columnDefinitions}
            items={data}
            loading={loading}
        />
      </SpaceBetween>
    </Container>
  );
};

export default MonthlyAppCodeHeatmap;

