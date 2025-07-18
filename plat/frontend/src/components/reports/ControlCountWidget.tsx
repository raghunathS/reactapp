import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useYearFilter } from '../../common/contexts/year-filter-context';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface ControlCountWidgetProps {
  csp: 'AWS' | 'GCP';
}

const ControlCountWidget = ({ csp }: ControlCountWidgetProps) => {
  const { selectedYear } = useYearFilter();
  const [data, setData] = useState<any[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reports/control-count-by-appcode`, {
          params: { year: selectedYear, csp },
        });
        setData(response.data.data);
        setConfigRules(response.data.config_rules);
      } catch (error) {
        console.error('Error fetching control count data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp]);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Container header={<Header variant="h2">Control Count by AppCode</Header>}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="AppCode" width={150} />
          <Tooltip />
          <Legend />
          {configRules.map((rule, index) => (
            <Bar key={rule} dataKey={rule} stackId="a" fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Table
        items={data}
        columnDefinitions={[
          { id: 'AppCode', header: 'AppCode', cell: (item) => item.AppCode },
          ...configRules.map((rule) => ({
            id: rule,
            header: rule,
            cell: (item: any) => item[rule],
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

export default ControlCountWidget;
