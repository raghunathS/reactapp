import React from 'react';
import {
  ContentLayout,
  Header,
  Container,
  Box,
  ColumnLayout,
  SpaceBetween,
} from '@cloudscape-design/components';
import BaseAppLayout from '../../components/base-app-layout';

const FinOpsPage: React.FC = () => {
  return (
    <BaseAppLayout
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              description="A central dashboard for monitoring and managing cloud financial operations, inspired by the FinOps Foundation principles."
            >
              FinOps Dashboard
            </Header>
          }
        >
          <SpaceBetween size="l">
            <Container
              header={<Header variant="h2">Inform Phase</Header>}
            >
              <ColumnLayout columns={3}>
                <div>
                  <Box variant="awsui-key-label">Total Spend (MTD)</Box>
                  <div>$123,456.78</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Forecasted Spend</Box>
                  <div>$250,000.00</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Budget vs. Actual</Box>
                  <div>85%</div>
                </div>
              </ColumnLayout>
            </Container>

            <Container
              header={<Header variant="h2">Optimize Phase</Header>}
            >
              <ColumnLayout columns={2}>
                <div>
                  <Box variant="awsui-key-label">Potential Savings</Box>
                  <div>$25,000/mo</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Unused Resources</Box>
                  <div>152 Items</div>
                </div>
              </ColumnLayout>
            </Container>

            <Container
              header={<Header variant="h2">Operate Phase</Header>}
            >
               <ColumnLayout columns={2}>
                <div>
                  <Box variant="awsui-key-label">Cost Anomaly Alerts</Box>
                  <div>3 Active</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Automation Coverage</Box>
                  <div>70%</div>
                </div>
              </ColumnLayout>
            </Container>
          </SpaceBetween>
        </ContentLayout>
      }
    />
  );
};

export default FinOpsPage;
