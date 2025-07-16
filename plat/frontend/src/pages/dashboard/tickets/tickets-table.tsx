import { useEffect, useState } from "react";
import {
  Box,
  SpaceBetween,
  TableProps,
  Header,
  Table,
  StatusIndicator,
  Pagination,
  Button,
} from "@cloudscape-design/components";

// Define the Ticket type
interface Ticket {
  id: number;
  subject: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  created_at: string;
}

const TicketColumnDefinitions: TableProps.ColumnDefinition<Ticket>[] = [
  {
    id: "id",
    header: "Ticket ID",
    sortingField: "id",
    cell: (item) => item.id,
    isRowHeader: true,
  },
  {
    id: "subject",
    header: "Subject",
    sortingField: "subject",
    cell: (item) => item.subject,
  },
  {
    id: "status",
    header: "Status",
    sortingField: "status",
    cell: (item) => {
        let statusType: "success" | "info" | "error" = "info";
        if (item.status === 'Closed') statusType = "success";
        if (item.status === 'Open') statusType = "error";
        return <StatusIndicator type={statusType}>{item.status}</StatusIndicator>
    },
  },
  {
    id: "priority",
    header: "Priority",
    sortingField: "priority",
    cell: (item) => item.priority,
  },
  {
    id: "created_at",
    header: "Created At",
    sortingField: "created_at",
    cell: (item) => new Date(item.created_at).toLocaleDateString(),
  },
];

export default function TicketsTable() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8001/api/tickets?page=${currentPageIndex}&size=${pageSize}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTickets(data.tickets);
        setTotalTickets(data.total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentPageIndex]);

  return (
    <Table
      loading={loading}
      loadingText="Loading tickets"
      columnDefinitions={TicketColumnDefinitions}
      items={tickets}
      header={
        <Header
          actions={
            <Button
              variant="primary"
              onClick={() => window.open('http://localhost:8001/api/tickets/download', '_blank')}
            >
              Download CSV
            </Button>
          }
        >
          All Tickets
        </Header>
      }
      pagination={
        <Pagination
          currentPageIndex={currentPageIndex}
          pagesCount={Math.ceil(totalTickets / pageSize)}
          onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
        />
      }
      empty={
        <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
          <SpaceBetween size="xxs">
            <div>
              <b>No tickets found</b>
            </div>
          </SpaceBetween>
        </Box>
      }
    />
  );
}
