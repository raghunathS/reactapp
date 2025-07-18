import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useGlobalFilters } from "../../../common/contexts/GlobalFilterContext";
import {
  Button,
  CollectionPreferences,
  type CollectionPreferencesProps,
  Header,
  Input,
  Link,
  Pagination,
  SpaceBetween,
  StatusIndicator,
  Table,
  type TableProps,
} from "@cloudscape-design/components";

// Define the Ticket type to match the backend response
interface Ticket {
  Key: string;
  Summary: string;
  Status: string; // This will be dynamically created by the frontend
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

// Static column definitions without filter inputs
const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Ticket>[] = [
  {
    id: "Key",
    header: "Ticket ID",
    cell: (item) => (
      <Link href={`https://myjira.jiira.com/issues/${item.Key}`} external>
        {item.Key}
      </Link>
    ),
    sortingField: "Key",
    isRowHeader: true,
  },
  {
    id: "Summary",
    header: "Summary",
    cell: (item) => item.Summary,
    sortingField: "Summary",
  },
  {
    id: "Status",
    header: "Status",
    cell: (item) => {
      const isResolved = item.tResolved !== null && item.tResolved !== "";
      const statusType = isResolved ? "success" : "error";
      const statusText = isResolved ? "Closed" : "Open";
      return <StatusIndicator type={statusType}>{statusText}</StatusIndicator>;
    },
    sortingField: "tResolved", // Sort by resolution time
  },
  {
    id: "Priority",
    header: "Priority",
    cell: (item) => item.Priority,
    sortingField: "Priority",
  },
  {
    id: "tCreated",
    header: "Created At",
    cell: (item: Ticket) => new Date(item.tCreated).toLocaleDateString(),
    sortingField: "tCreated",
  },
  {
    id: "AppCode",
    header: "Application",
    cell: (item: Ticket) => item.AppCode,
    sortingField: "AppCode",
  },
  {
    id: "CSP",
    header: "Cloud",
    cell: (item) => item.CSP,
    sortingField: "CSP",
  },
  {
    id: "Environment",
    header: "Environment",
    cell: (item) => item.Environment,
    sortingField: "Environment",
  },
  {
    id: "NarrowEnvironment",
    header: "Narrow Environment",
    cell: (item) => item.NarrowEnvironment,
    sortingField: "NarrowEnvironment",
  },
  {
    id: "AlertType",
    header: "Alert Type",
    cell: (item) => item.AlertType,
    sortingField: "AlertType",
  },
  {
    id: "ConfigRule",
    header: "Config Rule",
    cell: (item) => item.ConfigRule,
    sortingField: "ConfigRule",
  },
  {
    id: "Account",
    header: "Account",
    cell: (item) => item.Account,
    sortingField: "Account",
  },
];

const VISIBLE_CONTENT_OPTIONS = {
  title: "Select visible columns",
  options: [
    {
      label: "Ticket Fields",
      options: COLUMN_DEFINITIONS.map((c) => ({
        id: c.id!,
        label: c.header as string,
        editable: c.id !== "Key",
      })),
    },
  ],
};

export default function TicketsTable() {
  const { selectedYear, selectedEnvironment, selectedNarrowEnvironment } = useGlobalFilters();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<Ticket>>({ sortingField: "tCreated" });
  const [isDescending, setIsDescending] = useState<boolean>(true);
  const [filters, setFilters] = useState<Partial<Record<keyof Ticket, string>>>({});
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    wrapLines: false,
    visibleContent: COLUMN_DEFINITIONS.map((c) => c.id!).filter(
      (id) => !["Account", "ConfigRule", "AlertType"].includes(id)
    ),
  });

  const columnDefinitionsWithFilters = useMemo(() => {
    return COLUMN_DEFINITIONS.map((def) => {
      // Don't add filter for status column as it's derived
      if (def.id === 'Status') {
        return def;
      }

      // Use the correct parameter name for backend filtering
      const filterKey = def.id === 'Environment' ? 'column_environment' : def.id === 'NarrowEnvironment' ? 'column_narrow_environment' : def.id;

      return {
        ...def,
        header: (
          <div>
            <div>{def.header}</div>
            <Input
              value={filters[filterKey as keyof Ticket] || ""}
              onChange={(event) => {
                setFilters((prevFilters) => ({
                  ...prevFilters,
                  [filterKey as keyof Ticket]: event.detail.value,
                }));
                setCurrentPage(1); // Reset to first page on filter change
              }}
              placeholder={`Filter by ${def.header}`}
            />
          </div>
        ),
      };
    });
  }, [filters]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/tickets", {
          params: {
            page: currentPage,
            size: preferences.pageSize,
            sort_by: sortingColumn.sortingField,
            sort_order: isDescending ? "desc" : "asc",
            year: selectedYear, // Corrected from global_year
            global_environment: selectedEnvironment,
            global_narrow_environment: selectedNarrowEnvironment,
            // Spread the column filters into the params object
            ...filters,
          },
        });
        setTickets(response.data.tickets);
        setTotalCount(response.data.total_count); // Corrected from response.data.total
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentPage, preferences.pageSize, sortingColumn, isDescending, filters, selectedYear, selectedEnvironment, selectedNarrowEnvironment]);

  const handleSort = (detail: TableProps.SortingState<Ticket>) => {
    if (detail.sortingColumn.sortingField) {
      setSortingColumn(detail.sortingColumn);
      setIsDescending(detail.isDescending || false);
      setCurrentPage(1);
    }
  };

  const handleDownload = async () => {
    try {
      const columnFilters = Object.entries(filters)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}:${value}`)
        .join(",");

      const response = await axios.get("/api/download_tickets", {
        params: {
          sortField: sortingColumn.sortingField,
          sortOrder: isDescending ? "desc" : "asc",
          filters: columnFilters,
          global_year: selectedYear,
          global_environment: selectedEnvironment,
          global_narrow_environment: selectedNarrowEnvironment,
          visibleColumns: preferences.visibleContent?.join(","),
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tickets.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading tickets:", error);
    }
  };

  return (
    <Table
      items={tickets}
      columnDefinitions={columnDefinitionsWithFilters}
      visibleColumns={preferences.visibleContent}
      loading={loading}
      loadingText="Loading tickets..."
      header={
        <Header
          counter={`(${totalCount})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={handleDownload}>Download CSV</Button>
            </SpaceBetween>
          }
        >
          All Tickets
        </Header>
      }
      pagination={
        <Pagination
          currentPageIndex={currentPage}
          pagesCount={Math.ceil(totalCount / (preferences.pageSize || 25))}
          onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
        />
      }
      sortingColumn={sortingColumn}
      sortingDescending={isDescending}
      onSortingChange={({ detail }) => handleSort(detail)}
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={({ detail }) =>
            setPreferences(detail as CollectionPreferencesProps.Preferences)
          }
          pageSizePreference={{
            title: "Page size",
            options: [
              { value: 25, label: "25 tickets" },
              { value: 50, label: "50 tickets" },
              { value: 100, label: "100 tickets" },
            ],
          }}
          wrapLinesPreference={{}}
          visibleContentPreference={VISIBLE_CONTENT_OPTIONS}
        />
      }
    />
  );
}
