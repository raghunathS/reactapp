import {
  Box,
  ColumnLayout,
  Container,
  Header,
  Spinner
} from '@cloudscape-design/components';
import { CSPStatistics } from '../../common/types';

interface StatisticsCardsProps {
  loading: boolean;
  awsStats?: CSPStatistics;
  gcpStats?: CSPStatistics;
}

const StatCard = ({ title, value, loading }: { title: string; value: string | number; loading: boolean }) => (
  <div>
    <Box variant="awsui-key-label">{title}</Box>
    <Box variant="awsui-value-large">
      {loading ? <Spinner /> : value}
    </Box>
  </div>
);

export default function StatisticsCards({ loading, awsStats, gcpStats }: StatisticsCardsProps) {
  return (
    <Container header={<Header variant="h2">Ticket Statistics</Header>}> 
      <ColumnLayout columns={4} variant="text-grid">
        <StatCard 
          title="AWS Total Tickets"
          loading={loading} 
          value={awsStats?.total_tickets ?? 'N/A'} 
        />
        <StatCard 
          title="AWS Monthly Average"
          loading={loading} 
          value={awsStats?.monthly_average ?? 'N/A'} 
        />
        <StatCard 
          title="GCP Total Tickets"
          loading={loading} 
          value={gcpStats?.total_tickets ?? 'N/A'} 
        />
        <StatCard 
          title="GCP Monthly Average"
          loading={loading} 
          value={gcpStats?.monthly_average ?? 'N/A'} 
        />
      </ColumnLayout>
    </Container>
  );
}
