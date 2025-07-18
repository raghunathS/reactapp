import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';

interface ControlCountChartWidgetProps {
  csp: 'AWS' | 'GCP';
}

const ControlCountChartWidget = ({ csp }: ControlCountChartWidgetProps) => {
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
        <XAxis dataKey="AppCode" angle={-45} textAnchor="end" height={70} />
        <YAxis />
        <Tooltip />
        <Legend />
        {configRules.map((rule, index) => (
          <Bar key={rule} dataKey={rule} stackId="a" fill={colors[index % colors.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ControlCountChartWidget;
