import { useState, useEffect } from 'react';
import { ContentLayout, Header, SpaceBetween, Table } from '@cloudscape-design/components';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Scatter, Legend, Cell, LabelList } from 'recharts';
import BaseAppLayout from '../../components/base-app-layout';

interface HeatmapData {
  application: string;
  priority: string;
  count: number;
}

const getCoolwarmColor = (value: number, min: number, max: number) => {
  const mid = (min + max) / 2;
  const blue = { r: 59, g: 76, b: 192 };
  const white = { r: 255, g: 255, b: 255 };
  const red = { r: 180, g: 4, b: 38 };

  let r, g, b;

  if (value <= mid) {
    const ratio = (mid - min) === 0 ? 1 : (value - min) / (mid - min);
    r = Math.round(blue.r + (white.r - blue.r) * ratio);
    g = Math.round(blue.g + (white.g - blue.g) * ratio);
    b = Math.round(blue.b + (white.b - blue.b) * ratio);
  } else {
    const ratio = (max - mid) === 0 ? 1 : (value - mid) / (max - mid);
    r = Math.round(white.r + (red.r - white.r) * ratio);
    g = Math.round(white.g + (red.g - white.g) * ratio);
    b = Math.round(white.b + (red.b - white.b) * ratio);
  }

  return `rgb(${r},${g},${b})`;
};

const HeatmapChart = ({ data }: { data: HeatmapData[] }) => {
  if (data.length === 0) return null;

  const applications = [...new Set(data.map(item => item.application))];
  const priorities = [...new Set(data.map(item => item.priority))];
  const counts = data.map(item => item.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  const chartData = data.map(item => ({
    x: applications.indexOf(item.application),
    y: priorities.indexOf(item.priority),
    z: item.count,
    fill: getCoolwarmColor(item.count, minCount, maxCount),
    ...item,
  }));

  return (
    <div style={{ height: '300px', backgroundColor: '#f5f5f5' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 60 }}>
          <CartesianGrid />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="application" 
            ticks={applications.map((_, i) => i)} 
            tickFormatter={(tick) => applications[tick]} 
            label={{ value: 'Application', position: 'insideBottom', offset: -20 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="priority" 
            ticks={priorities.map((_, i) => i)} 
            tickFormatter={(tick) => priorities[tick]}
            label={{ value: 'Priority', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis type="number" dataKey="z" range={[2000, 2000]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(_, __, props) => [
            `Count: ${props.payload.z}`,
            `Application: ${props.payload.application}`,
            `Priority: ${props.payload.priority}`
          ]} />
          <Legend />
          <Scatter name="Ticket Counts" data={chartData} shape="square">
            <LabelList dataKey="z" position="center" style={{ fill: 'black', fontSize: '12px' }} />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Item1Page() {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8001/api/tickets-by-priority');
        const data = await response.json();
        setHeatmapData(data);
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <BaseAppLayout
      content={
        <ContentLayout header={<Header variant="h1">Application vs. Priority Heatmap</Header>}>
          <SpaceBetween size="l">
            <HeatmapChart data={heatmapData} />
            <Table
              loading={loading}
              items={heatmapData}
              columnDefinitions={[
                { id: 'application', header: 'Application', cell: item => item.application, sortingField: 'application' },
                { id: 'priority', header: 'Priority', cell: item => item.priority, sortingField: 'priority' },
                { id: 'count', header: 'Ticket Count', cell: item => item.count, sortingField: 'count' },
              ]}
              header={<Header>Ticket Data</Header>}
            />
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
}
