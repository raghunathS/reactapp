import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface TicketCountTableWidgetProps {
  csp: 'AWS' | 'GCP';
}

const TicketCountTableWidget = ({ csp }: TicketCountTableWidgetProps) => {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [data, setData] = useState<any[]>([]);
  const [appCodes, setAppCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reports/ticket-count-by-appcode`, {
          params: { year: selectedYear, csp, environment: selectedEnvironment, narrow_environment: selectedNarrowEnvironment },
        });
        setData(response.data.data);
        setAppCodes(response.data.app_codes);
      } catch (error) {
        console.error('Error fetching ticket count data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp, selectedEnvironment, selectedNarrowEnvironment]);

  const tableItems = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const totalRow: { [key: string]: string | number } = { Month: 'Total' };

    appCodes.forEach(appCode => {
      totalRow[appCode] = data.reduce((sum, item) => sum + (item[appCode] || 0), 0);
    });

    return [...data, totalRow];
  }, [data, appCodes]);

  return (
    <Table
      items={tableItems}
      columnDefinitions={[
        { id: 'Month', header: 'Month', cell: (item) => item.Month, sortingField: 'Month' },
        ...appCodes.map((appCode) => ({
          id: appCode,
          header: appCode,
          cell: (item: any) => item[appCode] || 0,
        })),
        {
          id: 'Total',
          header: 'Total',
          cell: (item) => appCodes.reduce((total, appCode) => total + (item[appCode] || 0), 0),
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

export default TicketCountTableWidget;
