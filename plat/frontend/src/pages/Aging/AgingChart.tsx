import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, Box, SpaceBetween, Container, Header } from '@cloudscape-design/components';
import { AgingRecord } from '../../common/types';

interface AgingChartProps {
  records: AgingRecord[];
  loading: boolean;
  dataKey: keyof AgingRecord;
  title: string;
  color: string;
}

export default function AgingChart({ records, loading, dataKey, title, color }: AgingChartProps) {
  if (loading) {
    return (
        <Container header={<Header variant="h2">{title}</Header>}>
            <Box textAlign="center" color="inherit">
                <b>Loading chart...</b>
            </Box>
        </Container>
    );
  }

  const chartData = records.map(record => ({
    name: `${record.CSP} - ${record.Environment} - ${record.AlertType} - ${record.Priority}`,
    ...record
  }));

  const chartHeight = Math.max(400, chartData.length * 50);

  return (
    <Container header={<Header variant="h2">{title}</Header>}>
      <SpaceBetween direction="vertical" size="l">
        <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={300} tick={{ fontSize: 14 }} />
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
                <Bar dataKey={dataKey} fill={color} name={title.replace(/<[^>]*>?/gm, '')} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
        <Table
          items={records}
          columnDefinitions={[
            { id: 'csp', header: 'CSP', cell: item => item.CSP },
            { id: 'environment', header: 'Environment', cell: item => item.Environment },
            { id: 'alertType', header: 'Alert Type', cell: item => item.AlertType },
            { id: 'priority', header: 'Priority', cell: item => item.Priority },
            { id: 'value', header: title, cell: item => item[dataKey] },
          ]}
          empty={<Box textAlign="center" color="inherit"><b>No data</b></Box>}
        />
      </SpaceBetween>
    </Container>
  );
}
