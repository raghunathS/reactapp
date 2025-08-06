import React from 'react';
import { Table, Header, Pagination } from '@cloudscape-design/components';
import { useCollection } from '@cloudscape-design/collection-hooks';

interface ChartDataTableProps {
  title: string;
  columnDefinitions: any[];
  items: any[];
  loading?: boolean;
}

const ChartDataTable: React.FC<ChartDataTableProps> = ({ title, columnDefinitions, items, loading }) => {
  const { items: tableItems, collectionProps, paginationProps } = useCollection(items, {
    pagination: { pageSize: 10 },
    sorting: {},
  });

  return (
    <Table
      {...collectionProps}
      header={<Header variant="h3">{title}</Header>}
      columnDefinitions={columnDefinitions}
      items={tableItems}
      loading={loading}
      pagination={<Pagination {...paginationProps} />}
      variant="embedded"
      stripedRows
    />
  );
};

export default ChartDataTable;
