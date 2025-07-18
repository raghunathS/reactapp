import { FC } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Header, Container } from '@cloudscape-design/components';
import { EnvironmentSummaryResponse } from '../../../common/types';

// A simple color generator for dynamic environments
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];
const getColor = (index: number) => COLORS[index % COLORS.length];

interface GcpTicketsByMonthChartProps {
  data: EnvironmentSummaryResponse | null;
  loading: boolean;
}

const GcpTicketsByMonthChart: FC<GcpTicketsByMonthChartProps> = ({ data, loading }) => {

  if (loading) {
    return <Container><Header variant="h2">Loading GCP Tickets by Month...</Header></Container>;
  }

  const chartData = data?.gcp;

  if (!chartData || chartData.length === 0) {
    return (
      <Container>
        <div>No GCP data available.</div>
      </Container>
    );
  }

  // Dynamically derive environments from the data
  const allEnvs = new Set<string>();
  chartData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'Month') {
        allEnvs.add(key);
      }
    });
  });
  const environments = Array.from(allEnvs).sort();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Month" />
        <YAxis />
        <Tooltip />
        <Legend />
        {environments.map((env, index) => (
          <Bar key={env} dataKey={env} stackId="a" fill={getColor(index)} name={env} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default GcpTicketsByMonthChart;
