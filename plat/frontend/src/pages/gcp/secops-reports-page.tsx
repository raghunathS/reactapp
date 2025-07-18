import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ContentLayout,
  Header,
  BreadcrumbGroup,
  Button,
} from '@cloudscape-design/components';
import { useOnFollow } from '../../common/hooks/use-on-follow';
import { APP_NAME } from '../../common/constants';
import BaseAppLayout from '../../components/base-app-layout';
import ConfigurableDashboard from '../../components/configurable-dashboard';
import { SECOPS_WIDGET_REGISTRY } from '../../components/configurable-dashboard/secops-widgets';

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

  const defaultLayout = {
    lg: [
      { i: 'statistics', x: 0, y: 0, w: 12, h: 1 },
      { i: 'ticketCountChart', x: 0, y: 1, w: 6, h: 2 },
      { i: 'ticketCountTable', x: 6, y: 1, w: 6, h: 2 },
      { i: 'controlCountChart', x: 0, y: 3, w: 6, h: 2 },
      { i: 'controlCountTable', x: 6, y: 3, w: 6, h: 2 },
      { i: 'heatmapChart', x: 0, y: 5, w: 6, h: 3 },
      { i: 'heatmapTable', x: 6, y: 5, w: 6, h: 3 },
    ],
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
            <ConfigurableDashboard
              widgetRegistry={SECOPS_WIDGET_REGISTRY}
              initialLayouts={defaultLayout}
              storageKey="gcp-secops-dashboard-layout"
              widgetProps={{ csp: 'GCP' }}
            />
          </div>
        </ContentLayout>
      }
    />
  );
};

export default SecOpsReportsPage;
