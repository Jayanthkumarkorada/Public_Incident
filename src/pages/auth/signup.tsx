import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('public');
  const [showAdminKey, setShowAdminKey] = useState(false);

  const handleUserTypeChange = (event) => {
    const type = event.target.value;
    setUserType(type);
    setShowAdminKey(type === 'official');
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      userType: formData.get('userType'),
      adminKey: formData.get('adminKey'),
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong!');
      }

      router.replace('/auth/signin');
    } catch (error) {
      setError(error.message);
    }
    setIsLoading(false);
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="user-type-label">User Type</InputLabel>
            <Select
              labelId="user-type-label"
              id="userType"
              name="userType"
              label="User Type"
              required
              value={userType}
              onChange={handleUserTypeChange}
            >
              <MenuItem value="public">Public User</MenuItem>
              <MenuItem value="official">Official User</MenuItem>
            </Select>
          </FormControl>
          {showAdminKey && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="adminKey"
              label="Admin Key"
              type="password"
              id="adminKey"
            />
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </Button>
          <Link href="/auth/signin" variant="body2">
            {"Already have an account? Sign In"}
          </Link>
        </Box>
      </Box>
    </Container>
  );
}
