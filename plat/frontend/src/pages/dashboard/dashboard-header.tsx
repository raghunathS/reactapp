import { Button, Header, SpaceBetween } from "@cloudscape-design/components";
import RouterButton from "../../components/wrappers/router-button";
import RouterButtonDropdown from "../../components/wrappers/router-button-dropdown";

interface DashboardHeaderProps {
  onPrint: () => void;
}

export default function DashboardHeader({ onPrint }: DashboardHeaderProps) {
  return (
    <Header
      variant="h1"
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" onClick={onPrint}>Print Report</Button>
          <RouterButton href="/aws/secops-reports">View Items</RouterButton>
          <RouterButtonDropdown
            items={[
              {
                id: "add-data",
                text: "Add Item",
                href: "/aws/add",
              },
            ]}
          >
            Add data
          </RouterButtonDropdown>
        </SpaceBetween>
      }
    >
      Dashboard
    </Header>
  );
}
