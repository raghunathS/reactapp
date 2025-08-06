import ReactApexChart from 'react-apexcharts';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ApexOptions } from 'apexcharts';
import { Box, Container, Header, SpaceBetween, Button } from '@cloudscape-design/components';
import ChartDataTable from './ChartDataTable';

const MonthlyTrendChart = ({ data, heatmapData, appCodes, loading, csp, year }: { data: any[], heatmapData: any[], appCodes: string[], loading?: boolean, csp: string, year: number }) => {
  const [view, setView] = useState('monthly'); // 'monthly' or 'daily'
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [dailyHeatmapData, setDailyHeatmapData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  if (!data || data.length === 0) {
    return null; // Don't render anything if there's no data
  }

    useEffect(() => {
    if (view === 'daily' && selectedMonth !== null) {
      const fetchDailyData = async () => {
        setDailyLoading(true);
        try {
          const appCodeValues = appCodes.join(',');
          const response = await axios.get('/api/appcode-trends-daily', {
            params: { year, month: selectedMonth, csp, app_codes: appCodeValues }
          });
          setDailyData(response.data.daily_trend);
          setDailyHeatmapData(response.data.daily_heatmap);
        } catch (error) {
          console.error('Error fetching daily data:', error);
        } finally {
          setDailyLoading(false);
        }
      };
      fetchDailyData();
    }
  }, [view, selectedMonth, year, csp, appCodes]);

  const handleBackToMonthly = () => {
    setView('monthly');
    setSelectedMonth(null);
    setDailyData([]);
    setDailyHeatmapData([]);
  };

    const chartOptions: ApexOptions = {
    chart: {
      events: {
        zoomed: (_chartContext: any, { xaxis }: any) => {
          const fullRange = new Date(data[data.length - 1].Month).getTime() - new Date(data[0].Month).getTime();
          const currentRange = xaxis.max - xaxis.min;

          // If the zoom is reset or zoomed out wide enough, go back to monthly view
          if (view === 'daily' && currentRange >= fullRange * 0.9) { // Using 90% of full range as a threshold for reset
             handleBackToMonthly();
          }
        },
        beforeZoom: (_chartContext: any, { xaxis }: any) => {
          const range = xaxis.max - xaxis.min;
          // If zoom range is less than ~2 months, switch to daily view
          if (range < 60 * 24 * 60 * 60 * 1000) { 
            const centerDate = new Date((xaxis.min + xaxis.max) / 2);
            const month = centerDate.getMonth() + 1;
            if (selectedMonth !== month) {
              setSelectedMonth(month);
              setView('daily');
            }
          }
          return { xaxis };
        }
      },
      id: 'monthly-trend-chart',
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true
      }
    },
    xaxis: {
      categories: view === 'monthly' ? data.map(item => item.Month) : dailyData.map(item => item.Day),
      title: {
        text: view === 'monthly' ? 'Month' : 'Day'
      },
      type: 'datetime',
    },
    yaxis: {
      title: {
        text: 'Ticket Count'
      }
    },
    stroke: {
      curve: 'smooth' as 'smooth',
    },
    title: {
      text: 'Total Tickets per Month',
      align: 'left' as 'left'
    },
    dataLabels: {
      enabled: false
    }
  };

      const monthlyChartSeries = [
    {
      name: 'Total Tickets',
      data: data.map(item => item.count),
      type: 'area',
    },
    ...appCodes.map(code => ({
        name: code,
        data: heatmapData.map(row => row[code] || 0),
        type: 'line',
    }))
  ];

  const dailyChartSeries = [
    {
      name: 'Total Tickets',
      data: dailyData.map(item => item.count),
      type: 'area',
    },
    ...appCodes.map(code => ({
        name: code,
        data: dailyHeatmapData.map(row => row[code] || 0),
        type: 'line',
    }))
  ];

  const chartSeries = view === 'monthly' ? monthlyChartSeries : dailyChartSeries;

        const monthlyTableItems = data.map(totalItem => {
    const correspondingHeatmapItem = heatmapData.find(hItem => hItem.Month === totalItem.Month) || {};
    return {
        Month: totalItem.Month,
        Total: totalItem.count,
        ...appCodes.reduce((acc, code) => ({ ...acc, [code]: correspondingHeatmapItem[code] || 0 }), {})
    };
  });

  const dailyTableItems = dailyData.map(totalItem => {
    const correspondingHeatmapItem = dailyHeatmapData.find(hItem => hItem.Day === totalItem.Day) || {};
    return {
        Day: totalItem.Day,
        Total: totalItem.count,
        ...appCodes.reduce((acc, code) => ({ ...acc, [code]: correspondingHeatmapItem[code] || 0 }), {})
    };
  });

  const tableItems = view === 'monthly' ? monthlyTableItems : dailyTableItems;

    const monthlyColumnDefinitions = [
    {
      id: 'month',
      header: 'Month',
      cell: (item: any) => item.Month,
      sortingField: 'Month',
    },
    {
      id: 'total',
      header: 'Total',
      cell: (item: any) => item.Total,
      sortingField: 'Total',
    },
    ...appCodes.map(code => ({
        id: code,
        header: code,
        cell: (item: any) => item[code],
        sortingField: code,
    }))
  ];

  const dailyColumnDefinitions = [
    {
      id: 'day',
      header: 'Day',
      cell: (item: any) => item.Day,
      sortingField: 'Day',
    },
    {
      id: 'total',
      header: 'Total',
      cell: (item: any) => item.Total,
      sortingField: 'Total',
    },
    ...appCodes.map(code => ({
        id: code,
        header: code,
        cell: (item: any) => item[code],
        sortingField: code,
    }))
  ];

  const columnDefinitions = view === 'monthly' ? monthlyColumnDefinitions : dailyColumnDefinitions;

  return (
    <Container header={<Header variant="h2" actions={view === 'daily' && <Button onClick={handleBackToMonthly}>Back to Monthly View</Button>}>Monthly Ticket Trend</Header>}>
      <SpaceBetween size="l">
        <Box padding={{ horizontal: 'm' }}>
          <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={350} />
        </Box>
        <ChartDataTable
          title="Monthly Trend Data"
          columnDefinitions={columnDefinitions}
          items={tableItems}
          loading={loading || dailyLoading}
        />
      </SpaceBetween>
    </Container>
  );
};

export default MonthlyTrendChart;

