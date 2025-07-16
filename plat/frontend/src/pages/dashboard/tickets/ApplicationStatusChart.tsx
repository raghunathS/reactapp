import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Container, Header } from '@cloudscape-design/components';

const ApplicationStatusChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/tickets-by-application');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch application status data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading chart data...</p>;
  }

  return (
    <Container header={<Header variant="h2">Tickets by Application Status</Header>}> 
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={data}
            margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="application" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Open" stackId="a" fill="#ff5555" />
            <Bar dataKey="In Progress" stackId="a" fill="#ffc658" />
            <Bar dataKey="Closed" stackId="a" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </Container>
  );
};

export default ApplicationStatusChart;
