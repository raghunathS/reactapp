import { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  Tabs,
  Grid,
  Box,
  Spinner,
  BreadcrumbGroup,
  DatePicker,
  SpaceBetween,
} from '@cloudscape-design/components';
import HeartbeatGraph from './HeartbeatGraph.tsx';
import BaseAppLayout from '../../components/base-app-layout';

interface HeartbeatData {
  month: string; // Corresponds to 'Date' from backend, kept as 'month' for HeartbeatGraph compatibility
  count: number;
}

interface HeartbeatApiResponse {
  [key: string]: HeartbeatData[];
}

// Helper to format a Date object to a 'YYYY-MM-DD' string
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const HeartbeatPage = () => {
  const [activeTabId, setActiveTabId] = useState('aws');
  const [loading, setLoading] = useState(true);
  const [heartbeatData, setHeartbeatData] = useState<HeartbeatApiResponse>({});

  // State for date range, defaulting to the last 7 days
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(new Date().getDate() - 7);
  const [startDate, setStartDate] = useState(formatDate(sevenDaysAgo));

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/configrule-heartbeat?csp=${activeTabId}&start_date=${startDate}&end_date=${endDate}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setHeartbeatData(data);
      } catch (error) {
        console.error('Failed to fetch heartbeat data:', error);
        setHeartbeatData({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTabId, startDate, endDate]);

  const renderGraphs = () => {
    if (loading) {
      return (
        <Box textAlign="center" padding="xxl">
          <Spinner size="large" />
        </Box>
      );
    }

    const rules = Object.keys(heartbeatData);

    if (rules.length === 0) {
      return <Box padding={{ vertical: 'l' }}>No heartbeat data available for the selected criteria.</Box>;
    }

    return (
      <Grid gridDefinition={rules.map(() => ({ colspan: 4 }))}>
        {rules.map((rule) => (
          <HeartbeatGraph key={rule} title={rule} data={heartbeatData[rule]} />
        ))}
      </Grid>
    );
  };

  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: 'Dashboard', href: '/' },
            { text: 'Heartbeat', href: '/heartbeat' },
          ]}
        />
      }
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              actions={
                <SpaceBetween direction="horizontal" size="m">
                  <DatePicker
                    onChange={({ detail }) => setStartDate(detail.value)}
                    value={startDate}
                    placeholder="YYYY/MM/DD"
                  />
                  <DatePicker
                    onChange={({ detail }) => setEndDate(detail.value)}
                    value={endDate}
                    placeholder="YYYY/MM/DD"
                  />
                </SpaceBetween>
              }
            >
              ConfigRule Heartbeat
            </Header>
          }
        >
          <Tabs
            activeTabId={activeTabId}
            onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
            tabs={[
              { label: 'AWS', id: 'aws' },
              { label: 'GCP', id: 'gcp' },
            ]}
          />
          <Box padding={{ vertical: 'l' }}>{renderGraphs()}</Box>
        </ContentLayout>
      }
    />
  );
};

export default HeartbeatPage;
