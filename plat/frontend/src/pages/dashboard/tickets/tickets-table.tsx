import { useState, useEffect, useMemo } from "react";
import { useGlobalFilters } from "../../../common/contexts/GlobalFilterContext";
import {
  Button,
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Input,
  Link,
  Pagination,
  StatusIndicator,
  Table,
  type TableProps,
} from "@cloudscape-design/components";

// Define the Ticket type to match the backend response
interface Ticket {
  Key: string;
  Summary: string;
  Status: string; // This will be dynamically created
  Priority: string;
  tCreated: string;
  AppCode: string;
  CSP: string;
  tResolved: string | null;
  Environment: string;
  NarrowEnvironment: string;
  AlertType: string;
  ConfigRule: string;
  Account: string;
}

const getTicketColumnDefinitions = (
  filters: Partial<Record<keyof Ticket, string>>,
  setFilters: (filters: Partial<Record<keyof Ticket, string>>) => void
): TableProps.ColumnDefinition<Ticket>[] => [
  {
    id: "Key",
    header: (
      <div>
        <div>Ticket ID</div>
        <Input
          value={filters.Key || ''}
          onChange={event => setFilters({ ...filters, Key: event.detail.value })}
          placeholder="Filter by ID"
        />
      </div>
    ),
    sortingField: "Key",
    cell: (item) => <Link href={`https://myjira.jiira.com/issues/${item.Key}`} external>{item.Key}</Link>,
    isRowHeader: true,
  },
  {
    id: "Summary",
    header: (
      <div>
        <div>Summary</div>
        <Input
          value={filters.Summary || ''}
          onChange={event => setFilters({ ...filters, Summary: event.detail.value })}
          placeholder="Filter by Summary"
        />
      </div>
    ),
    sortingField: "Summary",
    cell: (item) => item.Summary,
  },
  {
    id: "Status",
    header: "Status",
    sortingField: "Status",
    cell: (item) => {
        const isResolved = item.tResolved !== null && item.tResolved !== '';
        const statusType = isResolved ? "success" : "error";
        const statusText = isResolved ? "Closed" : "Open";
        return <StatusIndicator type={statusType}>{statusText}</StatusIndicator>
    },
  },
  {
    id: "Priority",
    header: (
      <div>
        <div>Priority</div>
        <Input
          value={filters.Priority || ''}
          onChange={event => setFilters({ ...filters, Priority: event.detail.value })}
          placeholder="Filter by Priority"
        />
      </div>
    ),
    sortingField: "Priority",
    cell: (item) => item.Priority,
  },
  {
    id: "tCreated",
    header: "Created At",
    cell: (item: Ticket) => new Date(item.tCreated).toLocaleDateString(),
    sortingField: "tCreated",
  },
  {
    id: "AppCode",
    header: (
      <div>
        <div>Application</div>
        <Input
          value={filters.AppCode || ''}
          onChange={event => setFilters({ ...filters, AppCode: event.detail.value })}
          placeholder="Filter by App"
        />
      </div>
    ),
    cell: (item: Ticket) => item.AppCode,
    sortingField: "AppCode",
  },
    {
    id: "CSP",
    header: (
      <div>
        <div>Cloud</div>
        <Input
          value={filters.CSP || ''}
          onChange={event => setFilters({ ...filters, CSP: event.detail.value })}
          placeholder="Filter by Cloud"
        />
      </div>
    ),
    cell: (item: Ticket) => item.CSP,
    sortingField: "CSP",
  },
  {
    id: "Environment",
    header: (
      <div>
        <div>Environment</div>
        <Input
          value={filters.Environment || ''}
          onChange={event => setFilters({ ...filters, Environment: event.detail.value })}
          placeholder="Filter by Env"
        />
      </div>
    ),
    cell: (item: Ticket) => item.Environment,
    sortingField: "Environment",
  },
  {
    id: "NarrowEnvironment",
    header: (
      <div>
        <div>Narrow Env.</div>
        <Input
          value={filters.NarrowEnvironment || ''}
          onChange={event => setFilters({ ...filters, NarrowEnvironment: event.detail.value })}
          placeholder="Filter by Narrow Env"
        />
      </div>
    ),
    cell: (item: Ticket) => item.NarrowEnvironment,
    sortingField: "NarrowEnvironment",
  },
  {
    id: "AlertType",
    header: (
      <div>
        <div>Alert Type</div>
        <Input
          value={filters.AlertType || ''}
          onChange={event => setFilters({ ...filters, AlertType: event.detail.value })}
          placeholder="Filter by Type"
        />
      </div>
    ),
    cell: (item: Ticket) => item.AlertType,
    sortingField: "AlertType",
  },
  {
    id: "ConfigRule",
    header: (
      <div>
        <div>Config Rule</div>
        <Input
          value={filters.ConfigRule || ''}
          onChange={event => setFilters({ ...filters, ConfigRule: event.detail.value })}
          placeholder="Filter by Rule"
        />
      </div>
    ),
    cell: (item: Ticket) => item.ConfigRule,
    sortingField: "ConfigRule",
  },
  {
    id: "Account",
    header: (
      <div>
        <div>Account</div>
        <Input
          value={filters.Account || ''}
          onChange={event => setFilters({ ...filters, Account: event.detail.value })}
          placeholder="Filter by Account"
        />
      </div>
    ),
    cell: (item: Ticket) => item.Account,
    sortingField: "Account",
  },
];

const VISIBLE_CONTENT_OPTIONS: CollectionPreferencesProps.VisibleContentOptionsGroup[] = [
    {
        label: "Ticket Properties",
        options: [
            { id: "Key", label: "Ticket ID" },
            { id: "Summary", label: "Summary" },
            { id: "Status", label: "Status" },
            { id: "Priority", label: "Priority" },
            { id: "tCreated", label: "Created At" },
            { id: "AppCode", label: "Application" },
            { id: "CSP", label: "Cloud" },
            { id: "Environment", label: "Environment" },
            { id: "NarrowEnvironment", label: "Narrow Environment" },
            { id: "AlertType", label: "Alert Type" },
            { id: "ConfigRule", label: "Config Rule" },
            { id: "Account", label: "Account" },
        ]
    }
];

export default function TicketsTable() {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<Ticket>>({ sortingField: 'Key' });
  const [isDescending, setIsDescending] = useState<boolean>(false);
  const [filters, setFilters] = useState<Partial<Record<keyof Ticket, string>>>({});
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    visibleContent: ['Key', 'Summary', 'Status', 'Priority', 'tCreated', 'AppCode', 'CSP', 'Environment', 'NarrowEnvironment', 'AlertType', 'ConfigRule', 'Account'],
    pageSize: 25,
  });

  const columnDefinitions = useMemo(
    () => getTicketColumnDefinitions(filters, setFilters),
    [filters]
  );

  const fetchTickets = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPageIndex),
      size: String(preferences.pageSize),
      sort_by: sortingColumn.sortingField || 'Key',
      sort_order: isDescending ? 'desc' : 'asc',
      year: String(selectedYear),
      environment: selectedEnvironment === 'All' ? '' : selectedEnvironment,
      narrow_environment: selectedNarrowEnvironment === 'All' ? '' : selectedNarrowEnvironment,
      ...filters,
    });

    try {
      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = await response.json();
      setTickets(data.tickets);
      setTotalTickets(data.total);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentPageIndex, sortingColumn, isDescending, filters, preferences.pageSize, selectedYear, selectedEnvironment, selectedNarrowEnvironment]);

  const handleSortingChange = (detail: TableProps.SortingState<Ticket>) => {
    if (detail.sortingColumn) {
      setSortingColumn(detail.sortingColumn);
      setIsDescending(detail.isDescending || false);
    }
  };

  const handleDownload = async () => {
    const params = new URLSearchParams({
        sort_by: sortingColumn.sortingField || 'Key',
        sort_order: isDescending ? 'desc' : 'asc',
        year: String(selectedYear),
        global_environment: selectedEnvironment === 'All' ? '' : selectedEnvironment,
        global_narrow_environment: selectedNarrowEnvironment === 'All' ? '' : selectedNarrowEnvironment,
        ...filters
    });

    try {
        const response = await fetch(`/api/tickets/download?${params.toString()}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets_${selectedYear}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error('Error downloading tickets:', error);
    }
  };

  return (
    <Table
      items={tickets}
      columnDefinitions={columnDefinitions}
      loading={loading}
      loadingText="Loading tickets..."
      header={
        <Header
          counter={`(${totalTickets})`}
          actions={
            <Button iconName="download" onClick={handleDownload}>
              Download CSV
            </Button>
          }
        >
          Tickets
        </Header>
      }
      pagination={
        <Pagination
          currentPageIndex={currentPageIndex}
          pagesCount={Math.ceil(totalTickets / (preferences.pageSize || 25))}
          onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
        />
      }
      sortingColumn={sortingColumn}
      sortingDescending={isDescending}
      onSortingChange={({ detail }) => handleSortingChange(detail)}
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={({ detail }) => setPreferences(detail)}
          pageSizePreference={{
            title: "Page size",
            options: [
              { value: 25, label: "25 tickets" },
              { value: 50, label: "50 tickets" },
              { value: 100, label: "100 tickets" },
            ],
          }}
          visibleContentPreference={{
            title: "Select visible columns",
            options: VISIBLE_CONTENT_OPTIONS,
          }}
        />
      }
    />
  );
}
