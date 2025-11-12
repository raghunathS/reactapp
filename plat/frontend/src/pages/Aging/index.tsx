import { useState, useEffect } from 'react';
import { ContentLayout, Header, SpaceBetween, Form, FormField, Select, Button, Container, SelectProps } from "@cloudscape-design/components";
import BaseAppLayout from "../../components/base-app-layout";
import { ApiClient } from '../../common/api-client/api-client';
import { AgingFilterOptions, AgingRecord } from '../../common/types';
import AgingChart from './AgingChart';

const apiClient = new ApiClient();

const toSelectOption = (value: string) => ({ label: value, value });
const addAllOption = (options: SelectProps.Option[]) => [{ label: 'All', value: 'All' }, ...options];

export default function AgingPage() {
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [records, setRecords] = useState<AgingRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<AgingFilterOptions>({ CSP: [], Environment: [], AlertType: [], Priority: [] });

  const [selectedCsp, setSelectedCsp] = useState('All');
  const [selectedEnv, setSelectedEnv] = useState('All');
  const [selectedAlertType, setSelectedAlertType] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  useEffect(() => {
    apiClient.aging.getFilterOptions().then(options => {
      setFilterOptions(options);
      setLoadingFilters(false);
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const params: { [key: string]: string } = {};
    if (selectedCsp !== 'All') params.CSP = selectedCsp;
    if (selectedEnv !== 'All') params.Environment = selectedEnv;
    if (selectedAlertType !== 'All') params.AlertType = selectedAlertType;
    if (selectedPriority !== 'All') params.Priority = selectedPriority;

    const data = await apiClient.aging.getSummary(params);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedCsp, selectedEnv, selectedAlertType, selectedPriority]);

  return (
    <BaseAppLayout
      content={(
        <ContentLayout
          header={<Header variant="h1">Aging Dashboard</Header>}
        >
          <SpaceBetween size="l">
            <Container>
                <Form
                    actions={<Button variant="primary" onClick={fetchData} disabled={loading}>Apply filters</Button>}
                >
                    <SpaceBetween direction="horizontal" size="l">
                        <FormField label="CSP">
                            <Select
                                selectedOption={toSelectOption(selectedCsp)}
                                onChange={({ detail }) => setSelectedCsp(detail.selectedOption.value || 'All')}
                                options={addAllOption(filterOptions.CSP.map(toSelectOption))}
                                loadingText="Loading..."
                                statusType={loadingFilters ? 'loading' : 'finished'}
                            />
                        </FormField>
                        <FormField label="Environment">
                            <Select
                                selectedOption={toSelectOption(selectedEnv)}
                                onChange={({ detail }) => setSelectedEnv(detail.selectedOption.value || 'All')}
                                options={addAllOption(filterOptions.Environment.map(toSelectOption))}
                                loadingText="Loading..."
                                statusType={loadingFilters ? 'loading' : 'finished'}
                            />
                        </FormField>
                        <FormField label="Alert Type">
                            <Select
                                selectedOption={toSelectOption(selectedAlertType)}
                                onChange={({ detail }) => setSelectedAlertType(detail.selectedOption.value || 'All')}
                                options={addAllOption(filterOptions.AlertType.map(toSelectOption))}
                                loadingText="Loading..."
                                statusType={loadingFilters ? 'loading' : 'finished'}
                            />
                        </FormField>
                        <FormField label="Priority">
                            <Select
                                selectedOption={toSelectOption(selectedPriority)}
                                onChange={({ detail }) => setSelectedPriority(detail.selectedOption.value || 'All')}
                                options={addAllOption(filterOptions.Priority.map(toSelectOption))}
                                loadingText="Loading..."
                                statusType={loadingFilters ? 'loading' : 'finished'}
                            />
                        </FormField>
                    </SpaceBetween>
                </Form>
            </Container>
            <SpaceBetween direction="vertical" size="l">
                <AgingChart loading={loading} records={records} dataKey="average_hours_to_close" title="Average Hours to Close" color="#8884d8" />
                <AgingChart loading={loading} records={records} dataKey="resolved_within_24h" title="Resolved Within 24h" color="#82ca9d" />
                <AgingChart loading={loading} records={records} dataKey="percent_of_total" title="Percent of Total" color="#ffc658" />
                <AgingChart loading={loading} records={records} dataKey="percent_within_24h" title="Percent Resolved Within 24h" color="#ff7300" />
            </SpaceBetween>
          </SpaceBetween>
        </ContentLayout>
      )}
    />
  );
}
