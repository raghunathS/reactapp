import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useYearFilter } from '../../common/contexts/year-filter-context';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface TicketCountWidgetProps {
  csp: 'AWS' | 'GCP';
}

const TicketCountWidget = ({ csp }: TicketCountWidgetProps) => {
  const { selectedYear } = useYearFilter();
  const [data, setData] = useState<any[]>([]);
  const [appCodes, setAppCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reports/ticket-count-by-appcode`, {
          params: { year: selectedYear, csp },
        });
        setData(response.data.data);
        setAppCodes(response.data.app_codes);
      } catch (error) {
        console.error('Error fetching ticket count data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp]);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Container header={<Header variant="h2">Ticket Count by AppCode</Header>}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="Month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {appCodes.map((appCode, index) => (
            <Bar key={appCode} dataKey={appCode} stackId="a" fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Table
        items={data}
        columnDefinitions={[
          { id: 'Month', header: 'Month', cell: (item) => item.Month },
          ...appCodes.map((appCode) => ({
            id: appCode,
            header: appCode,
            cell: (item: any) => item[appCode],
          })),
        ]}
        loading={loading}
        loadingText="Loading data..."
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

export default TicketCountWidget;
