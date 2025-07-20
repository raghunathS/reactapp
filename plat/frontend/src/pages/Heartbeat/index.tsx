import { useState, useEffect } from 'react';
import {
  ContentLayout,
  Header,
  Tabs,
  Grid,
  Box,
  Spinner,
  BreadcrumbGroup,
} from '@cloudscape-design/components';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import HeartbeatGraph from './HeartbeatGraph.tsx';
import BaseAppLayout from '../../components/base-app-layout';

interface HeartbeatData {
  month: string;
  count: number;
}

interface HeartbeatApiResponse {
  [key: string]: HeartbeatData[];
}

const HeartbeatPage = () => {
  const { selectedYear: year } = useGlobalFilters();
  const [activeTabId, setActiveTabId] = useState('aws');
  const [loading, setLoading] = useState(true);
  const [heartbeatData, setHeartbeatData] = useState<HeartbeatApiResponse>({});

  useEffect(() => {
    if (!year) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/configrule-heartbeat?csp=${activeTabId}&year=${year}`);
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
  }, [activeTabId, year]);

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
            { text: "Dashboard", href: "/" },
            { text: "Heartbeat", href: "/heartbeat" },
          ]}
        />
      }
      content={
        <ContentLayout header={<Header variant="h1">ConfigRule Heartbeat</Header>}>
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
