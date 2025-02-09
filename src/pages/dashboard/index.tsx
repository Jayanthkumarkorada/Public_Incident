import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  LocalHospital,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    email: string;
  };
}

interface Facility {
  id: string;
  name: string;
  type?: string;
  contact: string;
  location?: string;
  area?: string;
  emergencyServices?: boolean;
  ambulanceNumber?: string;
  designation?: string;
  jurisdiction?: string;
  capacity?: number;
  services?: string[];
  estimatedDistance?: string;
  responseTime?: string;
}

interface Facilities {
  hospitals: Facility[];
  officials: Facility[];
  medicalCamps: Facility[];
}

interface Incident {
  _id: string;
  title: string;
  location: {
    address: string;
  };
  type: string;
  severity: string;
  status: string;
  description: string;
  reportedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  comments: Comment[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [facilitiesDialogOpen, setFacilitiesDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facilities | null>(null);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [statusUpdateIncident, setStatusUpdateIncident] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/incidents?page=${page}&limit=${pageSize}${searchQuery ? `&search=${searchQuery}` : ''}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }

      const data = await response.json();
      setIncidents(data.incidents);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (status === 'authenticated') {
      const timer = setTimeout(() => {
        fetchIncidents();
      }, 300); // Debounce search
      return () => clearTimeout(timer);
    }
  }, [status, router, page, searchQuery]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/incidents?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete incident');
      }

      fetchIncidents();
    } catch (err) {
      console.error('Error deleting incident:', err);
      setError('Failed to delete incident');
    }
  };

  const handleCommentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setCommentDialogOpen(true);
  };

  const handleCommentSubmit = async () => {
    if (!selectedIncident || !newComment.trim()) return;

    try {
      setCommentLoading(true);
      const response = await fetch('/api/incidents/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          incidentId: selectedIncident._id,
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      await fetchIncidents();
      setNewComment('');
      setCommentLoading(false);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
      setCommentLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  const fetchNearbyFacilities = async (location: string) => {
    try {
      setLoadingFacilities(true);
      const response = await fetch(`/api/facilities?location=${encodeURIComponent(location)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby facilities');
      }

      const data = await response.json();
      setFacilities(data);
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setError('Failed to load nearby facilities');
    } finally {
      setLoadingFacilities(false);
    }
  };

  const handleFacilitiesClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setFacilitiesDialogOpen(true);
    fetchNearbyFacilities(incident.location.address);
  };

  const filteredIncidents = incidents.filter((incident) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      incident.title.toLowerCase().includes(searchLower) ||
      incident.location.address.toLowerCase().includes(searchLower) ||
      incident.type.toLowerCase().includes(searchLower)
    );
  });

  const handleStatusUpdate = async () => {
    if (!statusUpdateIncident || !newStatus) return;

    try {
      const response = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: statusUpdateIncident._id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update the incident in the local state
      setIncidents((prevIncidents) =>
        prevIncidents.map((incident) =>
          incident._id === statusUpdateIncident._id
            ? { ...incident, status: newStatus }
            : incident
        )
      );

      setStatusUpdateIncident(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  if (status === 'loading' || loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Emergency Response Dashboard
          </Typography>
          {session?.user?.userType === 'official' && (
            <Button
              color="inherit"
              onClick={() => router.push('/analytics')}
              startIcon={<AnalyticsIcon />}
            >
              Analytics
            </Button>
          )}
          <Button 
            color="inherit" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Transport Incidents
        </Typography>
        <Box>
          <IconButton onClick={fetchIncidents} sx={{ mr: 1 }} title="Refresh incidents">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/incidents/new')}
          >
            Report Incident
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by incident type, title, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Incidents Timeline */}
      <Grid container spacing={3}>
        {filteredIncidents.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No incidents found
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredIncidents.map((incident) => (
            <Grid item xs={12} key={incident._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{incident.title}</Typography>
                    <Chip
                      label={`${incident.severity} Severity`}
                      color={getSeverityColor(incident.severity)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Location: {incident.location.address}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {incident.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={incident.status}
                      color={getStatusColor(incident.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={incident.type}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Reported by: ${incident.reportedBy.name}`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<CommentIcon />}
                    onClick={() => handleCommentClick(incident)}
                  >
                    Comments {incident.comments?.length > 0 && `(${incident.comments.length})`}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LocalHospital />}
                    onClick={() => handleFacilitiesClick(incident)}
                    color="primary"
                  >
                    Nearby Facilities
                  </Button>
                  {session.user.email === incident.reportedBy.email && (
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDelete(incident._id)}
                    >
                      Delete
                    </Button>
                  )}
                  {session?.user?.userType === 'official' && (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => setStatusUpdateIncident(incident)}
                    >
                      Update Status
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Typography sx={{ mx: 2, alignSelf: 'center' }}>
          Page {page} of {totalPages}
        </Typography>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </Box>

      {/* Comments Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => {
          setCommentDialogOpen(false);
          setSelectedIncident(null);
          setNewComment('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Comments - {selectedIncident?.title}
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {selectedIncident?.comments?.length === 0 ? (
              <ListItem>
                <ListItemText primary="No comments yet" />
              </ListItem>
            ) : (
              selectedIncident?.comments?.map((comment, index) => (
                <div key={comment._id}>
                  <ListItem>
                    <ListItemText
                      primary={comment.content}
                      secondary={`${comment.author.name} - ${new Date(comment.createdAt).toLocaleString()}`}
                    />
                  </ListItem>
                  {index < (selectedIncident?.comments?.length || 0) - 1 && <Divider />}
                </div>
              ))
            )}
          </List>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={commentLoading}
            />
            <IconButton
              color="primary"
              onClick={handleCommentSubmit}
              disabled={!newComment.trim() || commentLoading}
            >
              {commentLoading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCommentDialogOpen(false);
            setSelectedIncident(null);
            setNewComment('');
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Facilities Dialog */}
      <Dialog
        open={facilitiesDialogOpen}
        onClose={() => {
          setFacilitiesDialogOpen(false);
          setSelectedIncident(null);
          setFacilities(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nearby Facilities - {selectedIncident?.title}
          <Typography variant="subtitle2" color="text.secondary">
            Location: {selectedIncident?.location.address}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingFacilities ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Hospitals */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Hospitals
                </Typography>
                <List>
                  {facilities?.hospitals.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No hospitals found in this area" />
                    </ListItem>
                  ) : (
                    facilities?.hospitals.map((hospital) => (
                      <ListItem key={hospital.id}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>{hospital.name}</Typography>
                              <Chip
                                label={hospital.estimatedDistance}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Type: {hospital.type}
                              </Typography>
                              <Typography variant="body2">
                                Location: {hospital.location}
                              </Typography>
                              <Typography variant="body2">
                                Contact: {hospital.contact}
                              </Typography>
                              {hospital.ambulanceNumber && (
                                <Typography variant="body2" color="error">
                                  Ambulance: {hospital.ambulanceNumber}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Grid>

              {/* Officials */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Emergency Officials
                </Typography>
                <List>
                  {facilities?.officials.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No officials found in this area" />
                    </ListItem>
                  ) : (
                    facilities?.officials.map((official) => (
                      <ListItem key={official.id}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>{official.name}</Typography>
                              <Chip
                                label={`Response: ${official.responseTime}`}
                                size="small"
                                color="warning"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Designation: {official.designation}
                              </Typography>
                              <Typography variant="body2">
                                Jurisdiction: {official.jurisdiction}
                              </Typography>
                              <Typography variant="body2">
                                Contact: {official.contact}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Grid>

              {/* Medical Camps */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Medical Camps
                </Typography>
                <List>
                  {facilities?.medicalCamps.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="No medical camps found in this area" />
                    </ListItem>
                  ) : (
                    facilities?.medicalCamps.map((camp) => (
                      <ListItem key={camp.id}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>{camp.name}</Typography>
                              <Chip
                                label={camp.estimatedDistance}
                                size="small"
                                color="success"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                Location: {camp.location}
                              </Typography>
                              <Typography variant="body2">
                                Capacity: {camp.capacity} people
                              </Typography>
                              <Typography variant="body2">
                                Services: {camp.services?.join(', ')}
                              </Typography>
                              <Typography variant="body2">
                                Contact: {camp.contact}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setFacilitiesDialogOpen(false);
            setSelectedIncident(null);
            setFacilities(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={Boolean(statusUpdateIncident)}
        onClose={() => setStatusUpdateIncident(null)}
      >
        <DialogTitle>Update Incident Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateIncident(null)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
