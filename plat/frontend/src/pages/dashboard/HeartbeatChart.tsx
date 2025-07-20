import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Container, Header, Spinner } from '@cloudscape-design/components';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';

interface HeartbeatChartProps {
  csp: 'aws' | 'gcp';
  title: string;
}

interface HeartbeatData {
  dates: string[];
  success: number[];
  failed: number[];
}

const transformData = (data: HeartbeatData) => {
  return data.dates.map((date, index) => ({
    date,
    Success: data.success[index],
    Failed: data.failed[index],
  }));
};

export default function HeartbeatChart({ csp, title }: HeartbeatChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedYear } = useGlobalFilters();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/heartbeat-status?csp=${csp}&year=${selectedYear}`);
        const result: HeartbeatData = await response.json();
        if (result.dates) {
          setData(transformData(result));
        }
      } catch (error) {
        console.error(`Error fetching heartbeat data for ${csp}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [csp, selectedYear]);

  return (
    <Container header={<Header variant="h2">{title}</Header>}>
      {loading ? (
        <Box textAlign="center" padding={{ vertical: 'xxl' }}>
          <Spinner size="large" />
        </Box>
      ) : (
        <Box padding={{ top: 'm' }}>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Success" stroke="#1D8102" fill="#1D8102" fillOpacity={0.3} />
                <Area type="monotone" dataKey="Failed" stroke="#D13212" fill="#D13212" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Box>
      )}
    </Container>
  );
}
