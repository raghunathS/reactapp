import React from 'react';
import {
  Container,
  Header,
} from '@cloudscape-design/components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface HeartbeatData {
  month: string;
  count: number;
}

interface HeartbeatGraphProps {
  title: string;
  data: HeartbeatData[];
}

const HeartbeatGraph: React.FC<HeartbeatGraphProps> = ({ title, data }) => {
  return (
    <Container header={<Header variant="h3">{title}</Header>}>
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Container>
  );
};

export default HeartbeatGraph;
