import { useState } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Multiselect,
  Grid,
  BreadcrumbGroup,
} from '@cloudscape-design/components';
import { useOnFollow } from '../../common/hooks/use-on-follow';
import { APP_NAME } from '../../common/constants';
import BaseAppLayout from '../../components/base-app-layout';
import TicketCountWidget from '../../components/reports/TicketCountWidget';
import ControlCountWidget from '../../components/reports/ControlCountWidget';
import HeatmapWidget from '../../components/reports/HeatmapWidget';
import CSPStatisticsWidget from '../../components/reports/CSPStatisticsWidget';

const reportOptions = [
  { label: 'Ticket Count', value: 'ticket-count' },
  { label: 'Control Count', value: 'control-count' },
  { label: 'Heatmap', value: 'heatmap' },
];

const SecOpsReportsPage = () => {
  const onFollow = useOnFollow();
  const [selectedReports, setSelectedReports] = useState([
    { label: 'Ticket Count', value: 'ticket-count' },
    { label: 'Control Count', value: 'control-count' },
    { label: 'Heatmap', value: 'heatmap' },
  ]);

  const renderReport = (reportValue: string) => {
    switch (reportValue) {
      case 'ticket-count':
        return <TicketCountWidget csp="GCP" />;
      case 'control-count':
        return <ControlCountWidget csp="GCP" />;
      case 'heatmap':
        return <HeatmapWidget csp="GCP" />;
      default:
        return null;
    }
  };

  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            { text: APP_NAME, href: '/' },
            { text: 'GCP', href: '/gcp/secops-reports' },
            { text: 'SecOps Reports', href: '/gcp/secops-reports' },
          ]}
        />
      }
      content={
        <ContentLayout
          header={<Header variant="h1">GCP SecOps Reports</Header>}
        >
          <SpaceBetween size="l">
            <CSPStatisticsWidget csp="GCP" />
            <Multiselect
              selectedOptions={selectedReports}
              onChange={({ detail }) =>
                setSelectedReports(detail.selectedOptions as any)
              }
              options={reportOptions}
              placeholder="Choose reports to display"
              selectedAriaLabel="Selected"
            />
            <Grid gridDefinition={selectedReports.map(() => ({ colspan: 12 }))}>
              {selectedReports.map((report) => (
                <div key={report.value}>{renderReport(report.value)}</div>
              ))}
            </Grid>
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
};

export default SecOpsReportsPage;
