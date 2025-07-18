import { Scatter, ScatterChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useYearFilter } from '../../common/contexts/year-filter-context';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface HeatmapWidgetProps {
  csp: 'AWS' | 'GCP';
}

const CustomTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-45)">
        {payload.value}
      </text>
    </g>
  );
};

const HeatmapWidget = ({ csp }: HeatmapWidgetProps) => {
  const { selectedYear } = useYearFilter();
  const [data, setData] = useState<any[]>([]);
  const [appCodes, setAppCodes] = useState<string[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/reports/heatmap`, {
          params: { year: selectedYear, csp },
        });
        
        const { data, app_codes, config_rules } = response.data;
        
        const chartData = [];
        let maxCount = 0;
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].length; j++) {
            const count = data[i][j];
            if (count > 0) {
                chartData.push({ x: config_rules[j], y: app_codes[i], z: count });
            }
            if (count > maxCount) {
                maxCount = count;
            }
          }
        }

        setData(chartData);
        setAppCodes(app_codes);
        setConfigRules(config_rules);

      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp]);

  const tableData = appCodes.map((appCode) => {
      const row: { [key: string]: any } = { AppCode: appCode };
      configRules.forEach((rule) => {
          const point = data.find(d => d.y === appCode && d.x === rule);
          row[rule] = point ? point.z : 0;
      });
      return row;
  });

  return (
    <Container header={<Header variant="h2">Heatmap: AppCode vs. ConfigRule</Header>}>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 80, left: 100 }}>
            <CartesianGrid />
            <XAxis dataKey="x" type="category" name="ConfigRule" tick={<CustomTick />} interval={0} />
            <YAxis dataKey="y" type="category" name="AppCode" />
            <ZAxis dataKey="z" type="number" range={[0, 500]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Ticket Count" data={data} fill="#8884d8" shape="square" />
        </ScatterChart>
      </ResponsiveContainer>
      <Table
        items={tableData}
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

export default HeatmapWidget;
