import { FC } from 'react';
import {
  Box,
  Container,
  Header,
  SpaceBetween,
  Table,
  TableProps,
} from '@cloudscape-design/components';
import { EnvironmentSummaryResponse, MonthlyEnvChartItem } from '../../../common/types';

interface EnvironmentSummaryTableProps {
  data: EnvironmentSummaryResponse | null;
  loading: boolean;
}

const EnvironmentSummaryTable: FC<EnvironmentSummaryTableProps> = ({ data, loading }) => {
  if (loading) {
    return null; // The parent component will show a loading state
  }

  if (!data) {
    return <Container>No summary data available to display in a table.</Container>;
  }

  const renderTable = (title: string, tableData: MonthlyEnvChartItem[]) => {
    if (tableData.length === 0) {
      return (
        <Container header={<Header variant="h2">{title}</Header>}> 
          <div>No data available.</div>
        </Container>
      );
    }

    // Dynamically derive environments from the specific table's data
    const envsInTable = new Set<string>();
    tableData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'Month') {
          envsInTable.add(key);
        }
      });
    });
    const environments = Array.from(envsInTable).sort();

    const columnDefinitions: TableProps.ColumnDefinition<MonthlyEnvChartItem>[] = [
      { id: 'Month', header: 'Month', cell: item => item.Month, sortingField: 'Month' },
      ...environments.map(env => ({
        id: env,
        header: env,
        cell: (item: MonthlyEnvChartItem) => item[env] || 0,
      })),
      {
        id: 'Total',
        header: 'Total',
        cell: item => environments.reduce((total, env) => total + Number(item[env] || 0), 0),
      },
    ];

    return (
      <Table
        header={<Header variant="h2">{title}</Header>}
        items={tableData}
        columnDefinitions={columnDefinitions}
        trackBy="Month"
        empty={
          <Box textAlign="center" color="inherit">
            <b>No data</b>
          </Box>
        }
      />
    );
  };

  return (
    <SpaceBetween size="l">
      {renderTable('AWS Tickets Data', data.aws)}
      {renderTable('GCP Tickets Data', data.gcp)}
    </SpaceBetween>
  );
};

export default EnvironmentSummaryTable;
