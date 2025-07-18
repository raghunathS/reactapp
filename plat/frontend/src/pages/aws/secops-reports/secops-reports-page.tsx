import { useState } from 'react';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Multiselect,
  Grid,
  BreadcrumbGroup,
} from '@cloudscape-design/components';
import { useOnFollow } from '../../../common/hooks/use-on-follow';
import { APP_NAME } from '../../../common/constants';
import BaseAppLayout from '../../../components/base-app-layout';
import TicketCountWidget from '../../../components/reports/TicketCountWidget';
import ControlCountWidget from '../../../components/reports/ControlCountWidget';
import HeatmapWidget from '../../../components/reports/HeatmapWidget';

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
        return <TicketCountWidget csp="AWS" />;
      case 'control-count':
        return <ControlCountWidget csp="AWS" />;
      case 'heatmap':
        return <HeatmapWidget csp="AWS" />;
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
            { text: 'AWS', href: '/aws/secops-reports' },
            { text: 'SecOps Reports', href: '/aws/secops-reports' },
          ]}
        />
      }
      content={
        <ContentLayout
          header={<Header variant="h1">AWS SecOps Reports</Header>}
        >
          <SpaceBetween size="l">
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
