import { useState, useRef } from 'react';
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
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const input = printRef.current;
    if (input) {
      html2canvas(input, { 
        scale: 2, 
        useCORS: true,
        width: input.scrollWidth, // Capture full width
        height: input.scrollHeight // Capture full height
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = imgProps.width;
        const imgHeight = imgProps.height;

        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const newImgWidth = imgWidth * ratio;
        const newImgHeight = imgHeight * ratio;

        // Center the image
        const x = (pdfWidth - newImgWidth) / 2;
        const y = (pdfHeight - newImgHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, newImgWidth, newImgHeight);
        pdf.save('gcp-secops-report.pdf');
      });
    }
  };
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
          header={
            <Header
              variant="h1"
              actions={
                <Button variant="primary" onClick={handlePrint}>
                  Print Report
                </Button>
              }
            >
              GCP SecOps Reports
            </Header>
          }
        >
          <div ref={printRef}>
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
        </div>
        </ContentLayout>
      }
    />
  );
};

export default SecOpsReportsPage;
