import { ContentLayout, Header, Container, Box } from '@cloudscape-design/components';
import { FC } from 'react';

const AtcPage: FC = () => {
  return (
    <ContentLayout header={<Header variant="h1">ArchitectureToCode (ATC)</Header>}> 
      <Container>
        <Box textAlign="center" padding="xxl">
          <h1>Coming Soon</h1>
          <p>This section is under construction.</p>
        </Box>
      </Container>
    </ContentLayout>
  );
};

export default AtcPage;
