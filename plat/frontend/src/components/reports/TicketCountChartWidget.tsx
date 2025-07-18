import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';

interface TicketCountChartWidgetProps {
  csp: 'AWS' | 'GCP';
}

const TicketCountChartWidget = ({ csp }: TicketCountChartWidgetProps) => {
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

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
    <ResponsiveContainer width="100%" height={500}>
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
  );
};

export default TicketCountChartWidget;
