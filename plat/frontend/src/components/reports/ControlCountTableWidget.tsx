import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface ControlCountTableWidgetProps {
  csp: 'AWS' | 'GCP';
}

const ControlCountTableWidget = ({ csp }: ControlCountTableWidgetProps) => {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [data, setData] = useState<any[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reports/control-count-by-appcode`, {
          params: { year: selectedYear, csp, environment: selectedEnvironment, narrow_environment: selectedNarrowEnvironment },
        });
        setData(response.data.data);
        setConfigRules(response.data.config_rules);
      } catch (error) {
        console.error('Error fetching control count data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp, selectedEnvironment, selectedNarrowEnvironment]);

  const tableItems = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const totalRow: { [key: string]: string | number } = { AppCode: 'Total' };

    configRules.forEach(rule => {
      totalRow[rule] = data.reduce((sum, item) => sum + (item[rule] || 0), 0);
    });

    return [...data, totalRow];
  }, [data, configRules]);

  return (
    <Table
      items={tableItems}
      columnDefinitions={[
        { id: 'AppCode', header: 'AppCode', cell: (item) => item.AppCode, sortingField: 'AppCode' },
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

export default ControlCountTableWidget;
