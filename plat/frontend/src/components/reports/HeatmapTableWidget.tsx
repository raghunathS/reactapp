import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface HeatmapTableWidgetProps {
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

const HeatmapTableWidget = ({ csp }: HeatmapTableWidgetProps) => {
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

  return (
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
  );
};

export default HeatmapTableWidget;
