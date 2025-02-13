import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

interface Incident {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  location: {
    address: string;
  };
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchUserIncidents() {
      try {
        const response = await fetch('/api/incidents?userOnly=true');
        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }
        const data = await response.json();
        setUserIncidents(data.incidents);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setIsLoadingIncidents(false);
      }
    }

    if (session) {
      fetchUserIncidents();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!session) {
    return null;
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(event.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setSuccess('Password updated successfully');
      event.currentTarget.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        
        {/* User Information Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography>
              <strong>Email:</strong> {session.user.email}
            </Typography>
            <Typography>
              <strong>Name:</strong> {session.user.name}
            </Typography>
          </Box>
        </Paper>

        {/* User's Incidents Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Reported Incidents
          </Typography>
          {isLoadingIncidents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : userIncidents.length > 0 ? (
            <Grid container spacing={2}>
              {userIncidents.map((incident) => (
                <Grid item xs={12} key={incident._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {incident.title}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        Location: {incident.location.address}
                      </Typography>
                      <Typography variant="body2">
                        {incident.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Reported on: {new Date(incident.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>You haven't reported any incidents yet.</Typography>
          )}
        </Paper>

        {/* Password Change Section */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <Box component="form" onSubmit={handlePasswordChange}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPassword"
              label="Current Password"
              type="password"
              id="currentPassword"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
