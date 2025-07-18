import ReactApexChart from 'react-apexcharts';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import { ApexOptions } from 'apexcharts';
import Container from '@cloudscape-design/components/container';
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

const HeatmapChartWidget = ({ csp }: HeatmapWidgetProps) => {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [data, setData] = useState<HeatmapSeries[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
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
        setConfigRules(config_rules);

      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp, selectedEnvironment, selectedNarrowEnvironment]);

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
  };

  if (loading) {
    return <Container>Loading chart data...</Container>;
  }

  if (data.length === 0) {
    return (
      <Container>
        <Box textAlign="center" color="inherit">
          <b>No data available</b>
        </Box>
      </Container>
    );
  }

  return (
    <div id="chart">
      <ReactApexChart options={options} series={data} type="heatmap" height={900} />
    </div>
  );
};

export default HeatmapChartWidget;
