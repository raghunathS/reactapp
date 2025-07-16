import { useEffect, useState } from "react";
import {
  Container,
  Header
} from "@cloudscape-design/components";
import TicketStatusBarChart from "../../../TicketStatusBarChart";

interface TicketSummary {
  status: string;
  count: number;
}

export default function TicketsStatisticsBlock() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TicketSummary[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('http://localhost:8001/api/tickets-summary');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSummary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <Container header={<Header variant="h2">Ticket Status Summary</Header>}>
        {loading ? 'Loading chart...' : <TicketStatusBarChart data={summary} />}
    </Container>
  );
}
