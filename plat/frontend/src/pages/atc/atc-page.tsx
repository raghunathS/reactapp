import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useParams } from 'react-router-dom';
import Header from '@cloudscape-design/components/header';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';

import * as yaml from 'js-yaml';
import ReactFlow, { 
  Controls, 
  Background, 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  Connection, 
  Edge,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { Handle, Position } from 'reactflow';

interface Component {
  name: string;
  type: string;
  icon_path: string;
}

const CustomNode = ({ data }: { data: any }) => {
  return (
    <div style={{ 
      border: '1px solid #777',
      padding: '10px',
      borderRadius: '5px',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 150
    }}>
      <Handle type="target" position={Position.Top} />
      <img src={data.icon_path} alt={data.label} style={{ width: '40px', height: '40px' }} />
      <div style={{ marginTop: '5px', textAlign: 'center' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const AtcPage: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const [components, setComponents] = useState<Component[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (provider) {
      setIsLoading(true);
      const fetchComponents = async () => {
        try {
          const response = await axios.get(`/api/atc/${provider}/components`);
          setComponents(response.data);
        } catch (error) {
          console.error('Error fetching components:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchComponents();
    } else {
      // If no provider is present, don't show loading indefinitely.
      setIsLoading(false);
    }
  }, [provider]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds: Edge[]) => addEdge(params, eds)), [setEdges]);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    const name = event.dataTransfer.getData('application/name');

    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };

    const component = components.find(c => c.type === type);
    if (!component) return;

    const newNode: Node = {
      id: `${type}-${new Date().getTime()}`,
      type: 'custom', // Use the custom node type
      position,
      data: { 
        label: name, 
        icon_path: component.icon_path 
      },
    };

    setNodes((nds: Node[]) => nds.concat(newNode));
  };

    const onNodeClick = async (_event: React.MouseEvent, node: Node) => {
    // The component type is the first part of the node ID, e.g., 'gcp_cloud_storage'
    const componentType = node.id.split('-')[0];
    try {
      const response = await axios.get(`/api/atc/${provider}/components/${componentType}`);
      // Combine node data with fetched properties for the form
      const fullNodeDetails = {
        ...node,
        data: {
          ...node.data,
          ...response.data, // This contains the 'properties' array
        },
      };
      setSelectedNode(fullNodeDetails);
    } catch (error) {
      console.error('Error fetching component details:', error);
      setSelectedNode(node); // Fallback to basic node info
    }
  };

      const onDragStart = (event: React.DragEvent, component: Component) => {
    event.dataTransfer.setData('application/reactflow', component.type);
    event.dataTransfer.setData('application/name', component.name);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.');
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();

      // 1. Create diagram.json
      const diagram = { nodes, edges };
      const diagramFileHandle = await dirHandle.getFileHandle('diagram.json', { create: true });
      const diagramWritable = await diagramFileHandle.createWritable();
      await diagramWritable.write(JSON.stringify(diagram, null, 2));
      await diagramWritable.close();

      // 2. Create a YAML file for each component's properties
      for (const node of nodes) {
        const properties = { ...node.data };
        delete properties.icon_path;
        const yamlData = yaml.dump(properties);
        
        const yamlFileHandle = await dirHandle.getFileHandle(`${node.id}.yaml`, { create: true });
        const yamlWritable = await yamlFileHandle.createWritable();
        await yamlWritable.write(yamlData);
        await yamlWritable.close();
      }

      alert('Architecture saved successfully!');
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Error saving architecture:', error);
        alert('Failed to save architecture.');
      }
    }
  };

  const handleLoad = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Your browser does not support the File System Access API. Please use a modern browser like Chrome or Edge.');
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      let diagramContent: any = null;
      const yamlProperties: { [key: string]: any } = {};

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          if (entry.name === 'diagram.json') {
            const file = await entry.getFile();
            diagramContent = JSON.parse(await file.text());
          } else if (entry.name.endsWith('.yaml')) {
            const file = await entry.getFile();
            const nodeId = entry.name.replace('.yaml', '');
            yamlProperties[nodeId] = yaml.load(await file.text());
          }
        }
      }

      if (!diagramContent) {
        throw new Error('diagram.json not found in the selected directory.');
      }

      const { nodes: loadedNodes, edges: loadedEdges } = diagramContent;

      // Validate and enrich nodes
      const validatedNodes = [];
      for (const node of loadedNodes) {
        const componentType = node.id.split('-')[0];
        const defResponse = await axios.get(`/api/atc/${provider}/components/${componentType}`);
        const componentDef = defResponse.data;
        const validProperties = new Set(componentDef.properties.map((p: any) => p.name));

        const loadedProperties = yamlProperties[node.id];
        if (!loadedProperties) {
          throw new Error(`Property file ${node.id}.yaml not found for node ${node.data.label}.`);
        }

        for (const propName in loadedProperties) {
          if (propName === 'label') continue;
          if (!validProperties.has(propName)) {
            throw new Error(`Invalid property '${propName}' for component '${node.data.label}'.`);
          }
        }

        const component = components.find(c => c.type === componentType);
        validatedNodes.push({
          ...node,
          data: {
            ...loadedProperties,
            icon_path: component ? component.icon_path : '',
          },
        });
      }

      setNodes(validatedNodes);
      setEdges(loadedEdges || []);
      alert('Architecture loaded successfully!');
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Error loading architecture:', error);
        alert(`Failed to load architecture: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const handlePropertyChange = (property: string, value: string) => {
    if (!selectedNode) return;

    // Update the selected node's details
    const updatedNode = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [property]: value,
      },
    };
    setSelectedNode(updatedNode);

    // Also update the node in the main nodes array
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              [property]: value,
            },
          };
        }
        return node;
      })
    );
  };

  if (isLoading) {
    return <Box padding="l">Loading...</Box>;
  }

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        {/* Left Pane: Components */}
        <div style={{ width: '20%', padding: '10px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
          <Header
            variant="h2"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={handleLoad}>Load</Button>
              </SpaceBetween>
            }
          >Components</Header>
          {components.map((component) => (
            <div
              key={component.type}
              onDragStart={(event) => onDragStart(event, component)}
              draggable
              style={{ display: 'flex', alignItems: 'center', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px', cursor: 'grab' }}
            >
              <img src={component.icon_path} alt={component.name} style={{ width: '24px', height: '24px', marginRight: '8px' }} />
              <span>{component.name}</span>
            </div>
          ))}
        </div>

        {/* Center Pane: ReactFlow Canvas */}
        <div style={{ width: '60%', height: '100%' }} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            nodeTypes={nodeTypes}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {/* Right Pane: Properties */}
        <div style={{ width: '20%', padding: '10px', borderLeft: '1px solid #ccc', overflowY: 'auto' }}>
          <Header variant="h2">Properties</Header>
          {selectedNode && selectedNode.data.properties && (
            <div>
              <h4>{selectedNode.data.label}</h4>
              <p><small>ID: {selectedNode.id}</small></p>
              <form>
                {selectedNode.data.properties.map((prop: any) => (
                  <div key={prop.name} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      {prop.name}{prop.required && <span style={{ color: 'red' }}>*</span>}
                    </label>
                    {prop.type === 'enum' ? (
                      <select
                        value={selectedNode.data[prop.name] || prop.default}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        style={{ width: '100%', padding: '5px' }}
                      >
                        {prop.options.map((option: string) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={prop.type}
                        value={selectedNode.data[prop.name] || prop.default || ''}
                        onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
                        style={{ width: '100%', padding: '5px' }}
                      />
                    )}
                  </div>
                ))}
              </form>
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default AtcPage;
