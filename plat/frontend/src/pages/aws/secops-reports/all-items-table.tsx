import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Box,
  SpaceBetween,
  Header,
  Pagination,
  Input,
  Button,
  Link,
  CollectionPreferences,
  CollectionPreferencesProps,
  TableProps,
} from '@cloudscape-design/components';
import { Ticket } from '../../../common/types';
import { TicketsApiClient } from '../../../common/api-client/tickets-api-client';
import { NonCancelableCustomEvent, PaginationProps } from '@cloudscape-design/components';

const apiClient = new TicketsApiClient();

// Master list of all possible columns, based on the Ticket type
const ALL_COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Ticket>[] = [
  { id: 'Key', header: 'Jira Key', cell: item => <Link href={`https://myjira.jiira.com/issues/${item.Key}`} target="_blank">{item.Key}</Link>, sortingField: 'Key' },
  { id: 'Priority', header: 'Priority', cell: item => item.Priority, sortingField: 'Priority' },
  { id: 'CSP', header: 'CSP', cell: item => item.CSP, sortingField: 'CSP' },
  { id: 'AppCode', header: 'App Code', cell: item => item.AppCode, sortingField: 'AppCode' },
  { id: 'Environment', header: 'Environment', cell: item => item.Environment, sortingField: 'Environment' },
  { id: 'Summary', header: 'Summary', cell: item => item.Summary, sortingField: 'Summary' },
  { id: 'Account', header: 'Account', cell: item => item.Account, sortingField: 'Account' },
  { id: 'tCreated', header: 'Created', cell: item => item.tCreated, sortingField: 'tCreated' },
  { id: 'tResolved', header: 'Resolved', cell: item => item.tResolved, sortingField: 'tResolved' },
  { id: 'TimeToResolve', header: 'Time to Resolve', cell: item => item.TimeToResolve, sortingField: 'TimeToResolve' },
];

// Columns that can be filtered
const FILTERABLE_COLUMNS = ['Key', 'Priority', 'CSP', 'AppCode', 'Environment', 'Account'];

interface AllItemsTableProps {
  selectedYear: number;
}

const AllItemsTable: React.FC<AllItemsTableProps> = ({ selectedYear }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sorting, setSorting] = useState<TableProps.SortingState<Ticket>>({ sortingColumn: { sortingField: 'Key' }, isDescending: false });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({ 
    pageSize: 25,
    visibleContent: ['Key', 'Priority', 'CSP', 'AppCode', 'Environment', 'tCreated'],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.getTickets({
        page: currentPageIndex,
        size: preferences.pageSize || 25,
        sortBy: sorting.sortingColumn.sortingField || 'Key',
        sortOrder: sorting.isDescending ? 'desc' : 'asc',
        filteringQuery: filters,
        year: selectedYear,
      });
      setTickets(result.tickets);
      setTotalCount(result.total_count);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPageIndex, preferences.pageSize, sorting, filters, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSortingChange = (event: NonCancelableCustomEvent<TableProps.SortingState<Ticket>>) => {
    setSorting(event.detail);
  };

  const handlePaginationChange = (event: NonCancelableCustomEvent<PaginationProps.ChangeDetail>) => {
    setCurrentPageIndex(event.detail.currentPageIndex);
  };

  const handleDownloadCsv = async () => {
    try {
      const blob = await apiClient.downloadTicketsCsv({ filteringQuery: filters });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download CSV:", error);
    }
  };

  // Dynamically build column definitions based on preferences
  const columnDefinitions = React.useMemo(() => 
    ALL_COLUMN_DEFINITIONS
      .filter(col => preferences.visibleContent?.includes(col.id!))
      .map(col => {
        if (FILTERABLE_COLUMNS.includes(col.id!)) {
          return {
            ...col,
            header: (
              <div>
                {col.header}
                <Input
                  value={filters[col.id!] || ''}
                  onChange={event => handleFilterChange(col.id!, event.detail.value)}
                  placeholder={`Filter by ${col.header}`}
                />
              </div>
            ),
          };
        }
        return col;
      })
  , [preferences.visibleContent, filters]);

  return (
    <Table
      items={tickets}
      columnDefinitions={columnDefinitions}
      loading={loading}
      loadingText="Loading tickets..."
      trackBy="Key"
      sortingColumn={sorting.sortingColumn}
      sortingDescending={sorting.isDescending}
      onSortingChange={handleSortingChange}
      header={
        <Header
          counter={totalCount ? `(${totalCount})` : '(0)'}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleClearFilters}>Clear filters</Button>
              <Button 
                variant="primary" 
                onClick={handleDownloadCsv}
                iconName="download"
              >
                Download as CSV
              </Button>
            </SpaceBetween>
          }
        >
          All Tickets
        </Header>
      }
      empty={
        <Box textAlign="center" color="inherit">
          <b>No tickets found</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            No tickets match the current filters.
          </Box>
          <Button onClick={handleClearFilters}>Clear filters</Button>
        </Box>
      }
      pagination={
        <Pagination
          currentPageIndex={currentPageIndex}
          pagesCount={Math.ceil(totalCount / (preferences.pageSize || 25))}
          onChange={handlePaginationChange}
        />
      }
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail as CollectionPreferencesProps.Preferences)}
          pageSizePreference={{
            title: "Page size",
            options: [
              { value: 25, label: "25 tickets" },
              { value: 50, label: "50 tickets" },
              { value: 100, label: "100 tickets" },
            ]
          }}
          visibleContentPreference={{
            title: "Select visible columns",
            options: [
              { 
                label: "Ticket Details", 
                options: ALL_COLUMN_DEFINITIONS.map(c => ({ 
                  id: c.id!,
                  label: c.header as string, 
                  editable: c.id !== 'Key' 
                })) 
              }
            ]
          }}
        />
      }
    />
  );
};

export default AllItemsTable;
