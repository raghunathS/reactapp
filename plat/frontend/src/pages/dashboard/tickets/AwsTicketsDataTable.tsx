import { FC } from 'react';
import {
  Box,
  Table,
  TableProps,
  Container
} from '@cloudscape-design/components';
import { EnvironmentSummaryResponse, MonthlyEnvChartItem } from '../../../common/types';

interface AwsTicketsDataTableProps {
  data: EnvironmentSummaryResponse | null;
  loading: boolean;
}

const AwsTicketsDataTable: FC<AwsTicketsDataTableProps> = ({ data, loading }) => {
  if (loading) {
    return <Container>Loading AWS tickets data...</Container>;
  }

  const tableData = data?.aws;

  if (!tableData || tableData.length === 0) {
    return (
      <Container>
        <div>No AWS data available.</div>
      </Container>
    );
  }

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

export default AwsTicketsDataTable;
