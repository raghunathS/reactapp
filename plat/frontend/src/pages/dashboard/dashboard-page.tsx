import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BreadcrumbGroup, ContentLayout, SpaceBetween } from "@cloudscape-design/components";
import { useOnFollow } from "../../common/hooks/use-on-follow";
import BaseAppLayout from "../../components/base-app-layout";
import DashboardHeader from "./dashboard-header";
import EnvironmentSummaryChart from "./tickets/EnvironmentSummaryChart";

import EnvironmentSummaryTable from './tickets/EnvironmentSummaryTable';
import TicketsTable from './tickets/tickets-table';
import StatisticsCards from './statistics-cards';
import { ApiClient } from '../../common/api-client/api-client';
import { EnvironmentSummaryResponse } from '../../common/types';

import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';

export default function DashboardPage() {
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
        pdf.save('dashboard-report.pdf');
      });
    }
  };
  const onFollow = useOnFollow();
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [summaryData, setSummaryData] = useState<EnvironmentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const apiClient = new ApiClient();
    apiClient.tickets.getEnvironmentSummary(selectedYear, selectedEnvironment, selectedNarrowEnvironment)
      .then((response) => {
        if (response.aws) response.aws.sort((a, b) => a.Month.localeCompare(b.Month));
        if (response.gcp) response.gcp.sort((a, b) => a.Month.localeCompare(b.Month));
        setSummaryData(response);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch environment summary data:', error);
        setLoading(false);
      });
  }, [selectedYear, selectedEnvironment, selectedNarrowEnvironment]);

  return (
    <BaseAppLayout
      contentType="dashboard"
      breadcrumbs={
        <BreadcrumbGroup
          onFollow={onFollow}
          items={[
            { text: "Dashboard", href: "/" },
            { text: "Tickets Dashboard", href: "/" },
          ]}
        />
      }
      content={
        <ContentLayout 
          header={<DashboardHeader onPrint={handlePrint} />}
        >
          <div ref={printRef}>
            <SpaceBetween size="l">
            <StatisticsCards 
              loading={loading}
              awsStats={summaryData?.aws_stats}
              gcpStats={summaryData?.gcp_stats}
            />
            <EnvironmentSummaryChart data={summaryData} loading={loading} />
                        <EnvironmentSummaryTable data={summaryData} loading={loading} />
            <TicketsTable />
            </SpaceBetween>
          </div>
        </ContentLayout>
      }
    />
  );
}
