import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ContentLayout,
  Header,
  SpaceBetween,
  Multiselect,
  Grid,
  BreadcrumbGroup,
  Tabs,
  MultiselectProps,
  Spinner,
  Alert,
  Box
} from '@cloudscape-design/components';
import { useOnFollow } from '../../common/hooks/use-on-follow';
import { APP_NAME } from '../../common/constants';
import BaseAppLayout from '../../components/base-app-layout';
import { useGlobalFilters } from '../../common/contexts/GlobalFilterContext';
import MonthlyTrendChart from '../../components/trends/MonthlyTrendChart';
import MonthlyAppCodeHeatmap from '../../components/trends/MonthlyAppCodeHeatmap';
import ConfigRuleTrendChart from '../../components/trends/ConfigRuleTrendChart';

const TrendLayout = ({ csp }: { csp: 'AWS' | 'GCP' }) => {
  const { selectedYear: year, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [appCodes, setAppCodes] = useState<{ label: string; value: string; }[]>([]);
  const [selectedAppCodes, setSelectedAppCodes] = useState<readonly MultiselectProps.Option[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapAppCodes, setHeatmapAppCodes] = useState<string[]>([]);
  const [configRuleTrendData, setConfigRuleTrendData] = useState<any[]>([]);
  const [configRules, setConfigRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available AppCodes for the dropdown
  useEffect(() => {
    const fetchAppCodes = async () => {
      try {
        const response = await axios.get('/api/tickets-filter-options');
        const appCodeOptions = response.data.AppCode.map((code: string) => ({ label: code, value: code }));
        setAppCodes(appCodeOptions);
      } catch (error) {
        console.error('Error fetching AppCodes:', error);
      }
    };
    fetchAppCodes();
  }, []);

  // Fetch trend data when selections change
  useEffect(() => {
    if (selectedAppCodes.length === 0) {
      setTrendData([]);
      setHeatmapData([]);
      setConfigRuleTrendData([]);
      return;
    }

    const fetchTrendData = async () => {
      setLoading(true);
      setError(null);
      try {
        const appCodeValues = selectedAppCodes.map(opt => opt.value).join(',');
        const response = await axios.get(`/api/appcode-trends`, {
          params: { 
            year, 
            csp, 
            app_codes: appCodeValues,
            environment: selectedEnvironment,
            narrow_environment: selectedNarrowEnvironment
          }
        });
        setTrendData(response.data.monthly_trend);
        const trendResponse = await axios.get(`/api/appcode-trends`, {
          params: { 
            year, 
            csp, 
            app_codes: appCodeValues,
            environment: selectedEnvironment,
            narrow_environment: selectedNarrowEnvironment
          }
        });
        setTrendData(trendResponse.data.monthly_trend);
        setHeatmapData(trendResponse.data.monthly_heatmap);
        setHeatmapAppCodes(trendResponse.data.app_codes);

        const configRuleResponse = await axios.get(`/api/appcode-configrule-trends`, {
          params: { 
            year, 
            csp, 
            app_codes: appCodeValues,
            environment: selectedEnvironment,
            narrow_environment: selectedNarrowEnvironment
          }
        });
        setConfigRuleTrendData(configRuleResponse.data.trend_data);
        setConfigRules(configRuleResponse.data.config_rules);
      } catch (error) {
        console.error('Error fetching trend data:', error);
        setError('Failed to load trend data. Please check the connection and try again.');
        setTrendData([]);
        setHeatmapData([]);
        setConfigRuleTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [selectedAppCodes, csp, year, selectedEnvironment, selectedNarrowEnvironment]);

  return (
    <SpaceBetween size="l">
      <Multiselect
        selectedOptions={selectedAppCodes}
        onChange={({ detail }) => setSelectedAppCodes(detail.selectedOptions)}
        options={appCodes}
        placeholder="Choose one or more AppCodes"
        selectedAriaLabel="Selected"
        loadingText="Loading AppCodes..."
        disabled={appCodes.length === 0}
      />
      {error && <Alert statusIconAriaLabel="Error" type="error">{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : selectedAppCodes.length > 0 && !error ? (
        <Grid gridDefinition={[{ colspan: 12 }, { colspan: 12 }]}>
          <MonthlyTrendChart 
            data={trendData} 
            heatmapData={heatmapData}
            appCodes={heatmapAppCodes}
            loading={loading}
            csp={csp}
            year={year}
          />
                    <MonthlyAppCodeHeatmap data={heatmapData} appCodes={heatmapAppCodes} loading={loading} />
          <ConfigRuleTrendChart data={configRuleTrendData} configRules={configRules} loading={loading} />
        </Grid>
      ) : !error ? (
        <Box textAlign="center" color="text-body-secondary">
          <p>Please select one or more AppCodes to view trend analysis.</p>
        </Box>
      ) : null}
    </SpaceBetween>
  );
};

const AppCodeTrendsPage: React.FC = () => {
  const onFollow = useOnFollow();

  return (
    <BaseAppLayout
      breadcrumbs={
        <BreadcrumbGroup
          items={[
            { text: APP_NAME, href: '/' },
            { text: 'SecOps', href: '/secops/all-reports' },
            { text: 'AppCode Trends', href: '/secops/appcode-trends' },
          ]}
          onFollow={onFollow}
        />
      }
      content={
        <ContentLayout
          header={
            <Header variant="h1">AppCode Trends</Header>
          }
        >
          <Tabs
            tabs={[
              {
                label: 'AWS',
                id: 'aws',
                content: <TrendLayout csp="AWS" />
              },
              {
                label: 'GCP',
                id: 'gcp',
                content: <TrendLayout csp="GCP" />
              },
            ]}
          />
        </ContentLayout>
      }
    />
  );
};

export default AppCodeTrendsPage;
