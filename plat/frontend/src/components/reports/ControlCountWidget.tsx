import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Treemap } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import Box from '@cloudscape-design/components/box';

interface ControlCountWidgetProps {
  csp: 'AWS' | 'GCP';
}

const ControlCountWidget = ({ csp }: ControlCountWidgetProps) => {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [data, setData] = useState<any[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
  const [ticketCounts, setTicketCounts] = useState<{[key: string]: number}>({});
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

        const ticketCountResponse = await axios.get('/api/reports/total-ticket-count-by-appcode', {
          params: { year: selectedYear, csp, environment: selectedEnvironment, narrow_environment: selectedNarrowEnvironment },
        });
        setTicketCounts(ticketCountResponse.data);

      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]);
        setConfigRules([]);
        setTicketCounts({});
      }
      setLoading(false);
    };

    fetchData();
  }, [selectedYear, csp, selectedEnvironment, selectedNarrowEnvironment]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      Total: configRules.reduce((sum, rule) => sum + (item[rule] || 0), 0),
    }));
  }, [data, configRules]);

  const tableItems = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    const dataWithTotals = chartData.map(item => ({...item}));

    const totalRow: { [key: string]: string | number } = { AppCode: 'Total' };
    let grandTotal = 0;

    configRules.forEach(rule => {
      const ruleTotal = data.reduce((sum, item) => sum + (item[rule] || 0), 0);
      totalRow[rule] = ruleTotal;
      grandTotal += ruleTotal;
    });
    totalRow['Total'] = grandTotal;

    return [...dataWithTotals, totalRow];
  }, [data, chartData, configRules]);

  const treemapData = useMemo(() => {
    return chartData.map(item => ({
      name: item.AppCode,
      size: ticketCounts[item.AppCode] || 0, // Size by ticket count
      ruleCount: item.Total, // Keep rule count for color
    }));
  }, [chartData, ticketCounts]);

  const colorScale = useMemo(() => {
    // Color scale is now based on ruleCount, not size (ticket count)
    const ruleCounts = treemapData.map(d => d.ruleCount).filter(s => typeof s === 'number' && isFinite(s) && s > 0);
    if (ruleCounts.length === 0) {
      return () => '#cccccc'; // Default to gray if no positive data
    }

    const min = Math.min(...ruleCounts);
    const max = Math.max(...ruleCounts);

    const blue = { r: 59, g: 130, b: 246 }; // #3B82F6
    const red = { r: 239, g: 68, b: 68 }; // #EF4444

    return (value: number) => {
      if (value === 0) return '#cccccc'; // Gray for zero
      if (max === min) return `rgb(${blue.r}, ${blue.g}, ${blue.b})`; // Blue if all values are the same

      const percentage = (value - min) / (max - min);
      
      const r = Math.round(blue.r + percentage * (red.r - blue.r));
      const g = Math.round(blue.g + percentage * (red.g - blue.g));
      const b = Math.round(blue.b + percentage * (red.b - blue.b));

      return `rgb(${r}, ${g}, ${b})`;
    };
  }, [treemapData]);

  const CustomizedContent = (props: any) => {
    const { depth, x, y, width, height, name, size, ruleCount } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: colorScale(ruleCount), // Color by rule count
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {depth === 1 && width > 50 && height > 25 ? (
          <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
            {name} ({size})
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <Container header={<Header variant="h2">Rules Count by AppCode</Header>}>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="AppCode" angle={-45} textAnchor="end" interval={0} height={100} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="Total" fill="#8884d8" name="Total Rules" />
        </BarChart>
      </ResponsiveContainer>

      <Header variant="h3">Rules Count Treemap</Header>
      <ResponsiveContainer width="100%" height={400}>
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          content={<CustomizedContent />}
        />
      </ResponsiveContainer>

      <Table
        items={tableItems}
        columnDefinitions={[
          { id: 'AppCode', header: 'AppCode', cell: (item) => item.AppCode, },
          ...configRules.map((rule) => ({
            id: rule,
            header: rule,
            cell: (item: any) => item[rule] || 0,
          })),
          {
            id: 'Total',
            header: 'Total',
            cell: (item: any) => <strong>{item.Total}</strong>,
          },
        ]}
        loading={loading}
        loadingText="Loading data..."
        stickyColumns={{ first: 1 }}
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
