import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
  Select,
  ContentLayout,
  Header,
  SpaceBetween,
  Container,
  Input,
  Button,
  Box,
  Spinner,
  Alert
} from '@cloudscape-design/components';
import BaseAppLayout from '../../components/base-app-layout';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const AgentPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<{ label: string; value: string; }[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ label: string; value: string; } | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

    useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const response = await axios.get('/api/agent/models');
        const modelOptions = response.data.models.map((model: string) => ({ label: model, value: model }));
        setModels(modelOptions);
        const defaultModel = modelOptions.find((m: {value: string}) => m.value === 'gemini-pro') || (modelOptions.length > 0 ? modelOptions[0] : null);
        setSelectedModel(defaultModel);
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setError('Failed to load AI models.');
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      const result = await axios.post('/api/agent/chat', {
                prompt: inputValue,
        model: selectedModel?.value,
      });
      const botMessage: Message = { sender: 'bot', text: result.data.response };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'An unexpected error occurred.';
      setError(errorMessage);
      const botMessage: Message = { sender: 'bot', text: `Error: ${errorMessage}` };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseAppLayout
      content={
        <ContentLayout
          header={
            <Header
              variant="h1"
              description="Chat with the AI agent for assistance."
            >
              AI Agent Chat
            </Header>
          }
        >
          <Container>
            <Box padding={{ bottom: 'm' }}>
              <div 
                style={{ 
                  height: '400px', 
                  overflowY: 'auto', 
                  padding: '0 10px'
                }}
              >
                <SpaceBetween size="m">
                  {messages.map((msg, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        gap: '8px',
                        maxWidth: '80%',
                      }}>
                        {msg.sender === 'bot' && <span style={{ fontSize: '24px' }}>🤖</span>}
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '12px',
                          backgroundColor: msg.sender === 'user' ? '#e6f3ff' : '#f0f0f0',
                          color: '#000',
                        }}>
                          {msg.sender === 'bot' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                        </div>
                        {msg.sender === 'user' && <span style={{ fontSize: '24px' }}>👤</span>}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Box textAlign="left">
                        <div style={{
                          display: 'inline-block',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          backgroundColor: '#f0f0f0',
                          color: 'black',
                        }}>
                          <Spinner />
                        </div>
                      </Box>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </SpaceBetween>
              </div>
            </Box>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flexGrow: 1 }}>
                              <Select
              selectedOption={selectedModel}
              onChange={({ detail }) => setSelectedModel(detail.selectedOption as { label: string; value: string; })}
              options={models}
              placeholder="Choose a model"
              disabled={isLoadingModels}
              loadingText="Loading models..."
              statusType={isLoadingModels ? 'loading' : 'finished'}
            />
            <Input
                    value={inputValue}
                    onChange={({ detail }) => setInputValue(detail.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => e.detail.key === 'Enter' && !loading && handleSendMessage()}
                    disabled={loading}
                  />
                </div>
                <Button variant="primary" onClick={handleSendMessage} disabled={loading || !inputValue.trim()}>
                  Send
                </Button>
              </div>
              {error && <Box padding={{top: 's'}}><Alert type="error" header="Error">{error}</Alert></Box>}
            </div>
          </Container>
        </ContentLayout>
      }
    />
  );
};

export default AgentPage;
