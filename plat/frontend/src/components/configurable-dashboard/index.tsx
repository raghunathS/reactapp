import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Header,
  Modal,
  SpaceBetween,
  ButtonDropdown,
  Icon,
} from '@cloudscape-design/components';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './styles.css';

import useDashboardPreferences from './use-dashboard-preferences';
import { WidgetDefinition } from './widgets';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ConfigurableDashboardProps {
  widgetRegistry: Record<string, WidgetDefinition>;
  storageKey: string;
  initialLayouts: { lg: any[] };
  headerText?: string;
  widgetProps?: Record<string, any>;
}

const ConfigurableDashboard: React.FC<ConfigurableDashboardProps> = ({
  widgetRegistry,
  storageKey,
  initialLayouts,
  headerText,
  widgetProps,
}) => {
  const [isModalVisible, setModalVisible] = useState(false);

  const [layout, setLayout] = useDashboardPreferences(
    storageKey,
    initialLayouts.lg
  );

  const visibleWidgets = widgetRegistry
    ? Object.values(widgetRegistry).filter((widget) =>
        layout.some(item => item.i === widget.id)
      )
    : [];

  return (
    <>
      {headerText && (
        <Header
          variant="h1"
          actions={
            <Button variant="primary" onClick={() => setModalVisible(true)}>
              Add widget
            </Button>
          }
        >
          {headerText}
        </Header>
      )}
      <Box margin={{ top: 'l' }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={(newLayout) => setLayout(newLayout)}
          draggableHandle=".drag-handle"
        >
          {visibleWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            const props = { ...widgetProps, ...widget.defaultConfig };
            return (
              <div key={widget.id}>
                <Container
                  header={
                    <Header
                      variant="h2"
                      description={widget.description}
                      actions={
                        <ButtonDropdown
                          items={[{ text: "Remove", id: "remove" }]}
                          onItemClick={() => setLayout(layout.filter(item => item.i !== widget.id))}
                          variant="icon"
                        />
                      }
                    >
                      <span className="drag-handle">
                        <Icon name="drag-indicator" />
                      </span>
                      {widget.title}
                    </Header>
                  }
                  fitHeight
                >
                  <WidgetComponent {...props} />
                </Container>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </Box>

      <Modal
        onDismiss={() => setModalVisible(false)}
        visible={isModalVisible}
        header="Add widgets to your dashboard"
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <Button variant="primary" onClick={() => setModalVisible(false)}>
              Done
            </Button>
          </Box>
        }
      >
        <SpaceBetween direction="vertical" size="m">
          {Object.values(widgetRegistry).map((widget) => (
            <Checkbox
              key={widget.id}
              checked={layout.some(item => item.i === widget.id)}
              onChange={({ detail }) => {
                if (detail.checked) {
                  const newWidgetLayout = {
                    i: widget.id,
                    x: 0,
                    y: Infinity, // This will place it at the bottom
                    w: 12, // Full width
                    h: widget.defaultSize?.rowspan || 2,
                  };
                  setLayout([...layout, newWidgetLayout]);
                } else {
                  setLayout(layout.filter((item) => item.i !== widget.id));
                }
              }}
            >
              <b>{widget.title}</b>
              <div>{widget.description}</div>
            </Checkbox>
          ))}
        </SpaceBetween>
      </Modal>
    </>
  );
};

export default ConfigurableDashboard;
