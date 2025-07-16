import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  ContentLayout,
  FormField,
  Grid,
  Header,
  Input,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import BaseAppLayout from '../../components/base-app-layout';

interface Message {
  sender: 'user' | 'agent';
  responses: Array<{
    type: 'text' | 'image';
    content: string;
    alt?: string;
  }>;
}

const ChatbotPage = () => {

  const { agentName } = useParams<{ agentName: 'aws' | 'gcp' }>();
  const agentDisplayName = agentName?.toUpperCase();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'agent',
      responses: [{ type: 'text', content: `Hello! I am the ${agentDisplayName} agent. How can I help you today?` }],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      responses: [{ type: 'text', content: inputValue }],
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8001/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, query: currentInput }),
      });
      const data = await response.json();
      
      const agentMessage: Message = {
        sender: 'agent',
        responses: data.responses,
      };
      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      const errorMessage: Message = {
        sender: 'agent',
        responses: [{ type: 'text', content: 'Sorry, something went wrong.' }],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseAppLayout
      content={
        <ContentLayout
          header={
            <Header variant="h1">
              Chat with {agentName?.toUpperCase()} Agent
            </Header>
          }
        >
          <Container>
            <SpaceBetween size="l">
              <Box>
                <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <SpaceBetween size="m">
                    {messages.map((msg, index) => (
                      <Box
                        key={index}
                        textAlign={msg.sender === 'user' ? 'right' : 'left'}
                      >
                        <div style={{
                          backgroundColor: msg.sender === 'user' ? '#f0f0f0' : '#e3f2fd',
                          borderRadius: '8px',
                          display: 'inline-block',
                          padding: '8px 12px',
                          maxWidth: '80%',
                          textAlign: 'left',
                        }}>
                          {msg.responses.map((res, resIndex) => {
                            if (res.type === 'text') {
                              return <span key={resIndex}>{res.content}</span>;
                            }
                            if (res.type === 'image') {
                              return <img key={resIndex} src={res.content} alt={res.alt || 'Chat image'} style={{ maxWidth: '100%', borderRadius: '4px', marginTop: '5px' }} />;
                            }
                            return null;
                          })}
                        </div>
                      </Box>
                    ))}
                    {loading && <Spinner />}
                  </SpaceBetween>
                </div>
              </Box>
              <FormField>
                <Grid gridDefinition={[{ colspan: 11 }, { colspan: 1 }]}>
                  <Input
                    value={inputValue}
                    onChange={({ detail }) => setInputValue(detail.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => { if (e.detail.key === 'Enter' && !loading) handleSendMessage(); }}
                  />
                  <Button iconName="angle-right-double" variant="icon" onClick={handleSendMessage} disabled={loading} />
                </Grid>
              </FormField>
            </SpaceBetween>
          </Container>
        </ContentLayout>
      }
    />
  );
};

export default ChatbotPage;
