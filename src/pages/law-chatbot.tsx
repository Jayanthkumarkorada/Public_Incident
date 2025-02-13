// src/pages/law-chatbot.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const WELCOME_MESSAGE = `Hello! I'm your legal assistant for transport-related incidents. I can help you with:
• Understanding transport laws and regulations
• Incident reporting procedures
• Legal rights and responsibilities
• Safety guidelines and best practices

How can I assist you today?`;

export default function LawChatbot() {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: WELCOME_MESSAGE, isUser: false, timestamp: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Protect the route
  useEffect(() => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/law-chatbot');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { 
      text: input.trim(), 
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get response');
      }

      const botMessage = { 
        text: data.response, 
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat Error:', err);
      setError(err.message || 'Failed to get response from the assistant');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null; // or a loading spinner
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          minHeight: '80vh',
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: theme.palette.background.default
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          Legal Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Get expert guidance on transport incidents, legal procedures, and safety regulations.
        </Typography>

        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          mb: 2,
          maxHeight: 'calc(80vh - 200px)',
        }}>
          <List>
            {messages.map((message, index) => (
              <ListItem
                key={index}
                sx={{
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '80%',
                    bgcolor: message.isUser ? 'primary.main' : 'background.paper',
                    color: message.isUser ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <ListItemText 
                    primary={message.text}
                    secondary={message.timestamp.toLocaleTimeString()}
                    secondaryTypographyProps={{
                      color: message.isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  />
                </Paper>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ 
            display: 'flex', 
            gap: 1,
            position: 'sticky',
            bottom: 0,
            bgcolor: theme.palette.background.default,
            pt: 2,
          }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about transport laws, incident procedures, or safety regulations..."
            disabled={loading}
            multiline
            maxRows={4}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            disabled={loading || !input.trim()}
            sx={{ 
              minWidth: 100,
              height: 56,
              borderRadius: 2,
            }}
          >
            Send
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}