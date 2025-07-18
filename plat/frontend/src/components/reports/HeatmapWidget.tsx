import ReactApexChart from 'react-apexcharts';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import { ApexOptions } from 'apexcharts';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface HeatmapWidgetProps {
  csp: 'AWS' | 'GCP';
}

interface HeatmapDataPoint {
  x: string;
  y: number;
}

interface HeatmapSeries {
  name: string;
  data: HeatmapDataPoint[];
}





const HeatmapWidget = ({ csp }: HeatmapWidgetProps) => {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [data, setData] = useState<HeatmapSeries[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
  const [appCodes, setAppCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reports/heatmap`, {
          params: { year: selectedYear, csp, environment: selectedEnvironment, narrow_environment: selectedNarrowEnvironment },
        });
        

        
        const { data: matrix, app_codes, config_rules } = response.data;

        const series = app_codes.map((appCode: string, i: number) => ({
          name: appCode,
          data: config_rules.map((rule: string, j: number) => ({
            x: rule,
            y: matrix[i][j],
          })),
        }));

        setData(series);
        setAppCodes(app_codes);
        setConfigRules(config_rules);

      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp, selectedEnvironment, selectedNarrowEnvironment]);

  const tableItems = useMemo(() => {
    const tableData = appCodes.map((appCode) => {
    const row: { [key: string]: any } = { AppCode: appCode };
    const seriesData = data.find(s => s.name === appCode)?.data || [];
    configRules.forEach(rule => {
      const point = seriesData.find(d => d.x === rule);
      row[rule] = point ? point.y : 0;
    });
    return row;
  });

    if (tableData.length === 0) {
      return [];
    }

    const totalRow: { [key: string]: string | number } = { AppCode: 'Total' };

    configRules.forEach(rule => {
      totalRow[rule] = tableData.reduce((sum, item) => sum + (item[rule] || 0), 0);
    });

    return [...tableData, totalRow];
  }, [data, appCodes, configRules]);

  const allValues = data.flatMap(series => series.data.map(d => d.y)).filter(y => y > 0);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
  const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;

  const getColorScaleRanges = () => {
    if (maxValue <= minValue) {
      return [
        { from: 0, to: 0, color: '#E5E7EB' }, // Gray for zero
        { from: minValue, to: maxValue, color: '#60A5FA' } // Single blue color if no range
      ];
    }

    const range = maxValue - minValue;
    const step = range / 4;
    const p1 = minValue + step;
    const p2 = minValue + 2 * step;
    const p3 = minValue + 3 * step;

    return [
      { from: 0, to: 0, color: '#E5E7EB', name: 'zero' }, // Gray for zero
      { from: minValue, to: p1, color: '#3B82F6', name: 'cool-1' }, // Dark Blue
      { from: p1, to: p2, color: '#93C5FD', name: 'cool-2' }, // Light Blue
      { from: p2, to: p3, color: '#FCA5A5', name: 'warm-1' }, // Light Red
      { from: p3, to: maxValue, color: '#EF4444', name: 'warm-2' }, // Dark Red
    ];
  };

  const options: ApexOptions = {
    chart: {
      height: 900,
      type: 'heatmap',
    },
    plotOptions: {
      heatmap: {
        radius: 0,
        enableShades: false,
        colorScale: {
          ranges: getColorScaleRanges(),
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: 'category',
      categories: configRules,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    title: {
      text: 'Heatmap Chart',
    },
  };

  return (
    <Container header={<Header variant="h2">Heatmap: AppCode vs. ConfigRule</Header>}>
      <div id="chart">
        <ReactApexChart options={options} series={data} type="heatmap" height={900} />
      </div>
      <Table
        items={tableItems}
        columnDefinitions={[
          { id: 'AppCode', header: 'AppCode', cell: (item) => item.AppCode },
          ...configRules.map((rule) => ({
            id: rule,
            header: rule,
            cell: (item: any) => item[rule] || 0,
          })),
          {
            id: 'Total',
            header: 'Total',
            cell: (item) => configRules.reduce((total, rule) => total + (item[rule] || 0), 0),
          },
        ]}
        loading={loading}
        loadingText="Loading data..."
        stickyColumns={{ first: 1 }}
        variant="embedded"
        empty={
          <Box textAlign="center" color="inherit">
            <b>No data available</b>
            <Box variant="p" color="inherit">
              There is no data to display.
            </Box>
          </Box>
        }
      />
    </Container>
  );
};

export default HeatmapWidget;
