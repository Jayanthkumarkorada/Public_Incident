import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';

const incidentTypes = [
  'Traffic Accident',
  'Vehicle Breakdown',
  'Road Blockage',
  'Public Transport Delay',
  'Infrastructure Issue',
  'Other',
];

const severityLevels = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

export default function NewIncident() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    type: '',
    severity: '',
    description: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (status === 'authenticated') {
      setPageLoading(false);
    }
  }, [status, router]);

  if (status === 'loading' || pageLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.title || !formData.location || !formData.type || !formData.severity) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Create FormData object to handle file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('location', formData.location);
      submitData.append('type', formData.type);
      submitData.append('severity', formData.severity);
      submitData.append('description', formData.description);
      if (photo) {
        submitData.append('photo', photo);
      }

      const response = await fetch('/api/incidents', {
        method: 'POST',
        body: submitData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create incident');
      }

      await router.push('/dashboard');
    } catch (err) {
      console.error('Error creating incident:', err);
      setError(err.message || 'Failed to create incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Report New Incident
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
            error={!formData.title && !!error}
            helperText={!formData.title && error ? 'Title is required' : ''}
          />

          <TextField
            fullWidth
            label="Location"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            sx={{ mb: 2 }}
            error={!formData.location && !!error}
            helperText={!formData.location && error ? 'Location is required' : ''}
          />

          <FormControl fullWidth sx={{ mb: 2 }} error={!formData.type && !!error}>
            <InputLabel>Type of Incident</InputLabel>
            <Select
              value={formData.type}
              label="Type of Incident"
              required
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {incidentTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }} error={!formData.severity && !!error}>
            <InputLabel>Severity Level</InputLabel>
            <Select
              value={formData.severity}
              label="Severity Level"
              required
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            >
              {severityLevels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoChange}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
              >
                Upload Photo (Optional)
              </Button>
            </label>
            {photoPreview && (
              <Box sx={{ mt: 2, position: 'relative' }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain'
                  }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                  sx={{ mt: 1 }}
                >
                  Remove Photo
                </Button>
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
