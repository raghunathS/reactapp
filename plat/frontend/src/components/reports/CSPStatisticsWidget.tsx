import { useState, useEffect } from 'react';
import { Box, ColumnLayout, Container, Header, Spinner } from '@cloudscape-design/components';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import { ApiClient } from '../../common/api-client/api-client';

interface CSPStatistics {
  total_tickets: number;
  monthly_average: number;
}

interface CSPStatisticsWidgetProps {
  csp: 'AWS' | 'GCP';
}

const CSPStatisticsWidget = ({ csp }: CSPStatisticsWidgetProps) => {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CSPStatistics | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const apiClient = new ApiClient();
        const data = await apiClient.tickets.getEnvironmentSummary(
          selectedYear,
          selectedEnvironment,
          selectedNarrowEnvironment
        );
        setStats(csp === 'AWS' ? data.aws_stats : data.gcp_stats);
      } catch (error) {
        console.error(`Error fetching ${csp} statistics:`, error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [csp, selectedYear, selectedEnvironment, selectedNarrowEnvironment]);

  return (
    <Container header={<Header variant="h2">{`${csp} Ticket Statistics`}</Header>}> 
      {loading ? (
        <Spinner />
      ) : stats ? (
        <ColumnLayout columns={2} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total Tickets</Box>
            <Box variant="awsui-value-large">{stats.total_tickets}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Monthly Average</Box>
            <Box variant="awsui-value-large">{stats.monthly_average}</Box>
          </div>
        </ColumnLayout>
      ) : (
        <Box variant="p" color="text-status-error">
          Could not load statistics.
        </Box>
      )}
    </Container>
  );
};

export default CSPStatisticsWidget;
