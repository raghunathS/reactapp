import BaseAppLayout from '../../components/base-app-layout';
import { ContentLayout } from '@cloudscape-design/components';
import ApplicationStatusChart from '../dashboard/tickets/ApplicationStatusChart';

export default function ItemsPage() {
  return (
    <BaseAppLayout
      content={
        <ContentLayout header={<h2>Section 1 Items</h2>}>
          <ApplicationStatusChart />
        </ContentLayout>
      }
    />
  );
}
