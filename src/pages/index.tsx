import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import { useEffect } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 'sm',
          }}
        >
          <Typography
            component="h1"
            variant="h3"
            gutterBottom
            sx={{ fontWeight: 'bold', color: 'primary.main' }}
          >
            Transport Incident Reporter
          </Typography>
          
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Report and track public transport incidents in real-time
          </Typography>

          <Stack spacing={2} direction="column" sx={{ width: '100%', maxWidth: 300 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => router.push('/auth/signin')}
              sx={{ height: 48 }}
            >
              Sign In
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => router.push('/auth/signup')}
              sx={{ height: 48 }}
            >
              Sign Up
            </Button>
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Sign up as a Public User to report incidents or as an Official to manage them.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
