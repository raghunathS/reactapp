import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Multiselect,
  Grid,
  BreadcrumbGroup,
  Button,
  Tabs,
  Box
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

const ReportLayout = ({ csp }: { csp: 'AWS' | 'GCP' }) => {
  const [selectedReports, setSelectedReports] = useState(reportOptions);

  const renderReport = (value: string) => {
    switch (value) {
      case 'ticket-count':
        return <TicketCountWidget csp={csp} />;
      case 'control-count':
        return <ControlCountWidget csp={csp} />;
      case 'heatmap':
        return <HeatmapWidget csp={csp} />;
      default:
        return null;
    }
  };

  return (
    <SpaceBetween size="l">
        <CSPStatisticsWidget csp={csp} />
        <Multiselect
            selectedOptions={selectedReports}
            onChange={({ detail }) => setSelectedReports(detail.selectedOptions as any)}
            options={reportOptions}
            placeholder="Choose reports to display"
            selectedAriaLabel="Selected"
        />
        <Grid gridDefinition={selectedReports.map(() => ({ colspan: 12 }))}>
            {selectedReports.map(report => (
            <div key={report.value}>{renderReport(report.value)}</div>
            ))}
        </Grid>
    </SpaceBetween>
  );
};

const AllReportsPage: React.FC = () => {
  const onFollow = useOnFollow();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const input = printRef.current;
    if (input) {
      html2canvas(input, { 
        scale: 2, 
        useCORS: true,
        width: input.scrollWidth,
        height: input.scrollHeight
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const newImgWidth = imgWidth * ratio;
        const newImgHeight = imgHeight * ratio;
        const x = (pdfWidth - newImgWidth) / 2;
        const y = (pdfHeight - newImgHeight) / 2;
        pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);
        pdf.save(`${APP_NAME}-SecOps-Reports.pdf`);
      });
    }
  };

  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: APP_NAME, href: '/' },
            { text: 'SecOps Reports', href: '/secops/all-reports' },
          ]}
          onFollow={onFollow}
        />
      }
      content={
        <div ref={printRef}>
          <ContentLayout
            header={
              <Header
                variant="h1"
                actions={<Button onClick={handlePrint}>Download as PDF</Button>}
              >
                SecOps Reports
              </Header>
            }
          >
            <Tabs
              tabs={[
                {
                  label: 'AWS',
                  id: 'aws',
                  content: <ReportLayout csp="AWS" />
                },
                {
                  label: 'GCP',
                  id: 'gcp',
                  content: <ReportLayout csp="GCP" />
                },
              ]}
            />
          </ContentLayout>
        </div>
      }
    />
  );
};

export default AllReportsPage;

