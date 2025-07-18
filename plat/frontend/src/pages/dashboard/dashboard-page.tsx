import { useState, useEffect } from 'react';
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

import { useYearFilter } from '../../common/contexts/year-filter-context';

export default function DashboardPage() {
  const onFollow = useOnFollow();
  const { selectedYear } = useYearFilter();
  const [summaryData, setSummaryData] = useState<EnvironmentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const apiClient = new ApiClient();
    apiClient.tickets.getEnvironmentSummary(selectedYear)
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
  }, [selectedYear]);

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
          header={<DashboardHeader />}
        >
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
        </ContentLayout>
      }
    />
  );
}
