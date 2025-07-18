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
import { Grid, Header, Container } from '@cloudscape-design/components';
import { EnvironmentSummaryResponse, MonthlyEnvChartItem } from '../../../common/types';

// A simple color generator for dynamic environments
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];
const getColor = (index: number) => COLORS[index % COLORS.length];

interface EnvironmentSummaryChartProps {
  data: EnvironmentSummaryResponse | null;
  loading: boolean;
}

const EnvironmentSummaryChart: FC<EnvironmentSummaryChartProps> = ({ data, loading }) => {

  if (loading) {
    return <Container><Header variant="h2">Loading Environment Summaries...</Header></Container>;
  }

  if (!data) {
    return <Container><Header variant="h2">Could not load environment summary data.</Header></Container>;
  }

  // Dynamically derive environments from the data
  const allEnvs = new Set<string>();
  const combinedData = [...(data.aws || []), ...(data.gcp || [])];
  combinedData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'Month') {
        allEnvs.add(key);
      }
    });
  });
  const environments = Array.from(allEnvs).sort();

  const renderChart = (
    title: string, 
    chartData: MonthlyEnvChartItem[] | undefined
  ) => {
    if (!chartData || chartData.length === 0) {
      return (
        <Container header={<Header variant="h2">{title}</Header>}>
          <div>No data available.</div>
        </Container>
      );
    }

    return (
      <Container header={<Header variant="h2">{title}</Header>}>
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
      </Container>
    );
  };

  return (
    <Grid gridDefinition={[{ colspan: { default: 12, m: 6 } }, { colspan: { default: 12, m: 6 } }]}>
      {renderChart('AWS Tickets by Month', data.aws)}
      {renderChart('GCP Tickets by Month', data.gcp)}
    </Grid>
  );
};

export default EnvironmentSummaryChart;
