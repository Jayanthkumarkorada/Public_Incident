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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
  Logout as LogoutIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
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
  photoUrl?: string;
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
  const [success, setSuccess] = useState('');
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

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

  const handleDelete = async (incidentId: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) {
      return;
    }

    try {
      const response = await fetch(`/api/incidents?id=${incidentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete incident';
        try {
          const data = await response.json();
          errorMessage = data.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Remove the deleted incident from the state
      setIncidents(prevIncidents => 
        prevIncidents.filter(incident => incident._id !== incidentId)
      );

      // Show success message
      setSuccess('Incident deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting incident:', error);
      setError(error.message || 'Failed to delete incident');
      setTimeout(() => setError(''), 3000);
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

  // Helper function to safely get severity text
  const getSeverityText = (severity: any): string => {
    return (severity && typeof severity === 'string') ? severity.toUpperCase() : 'UNKNOWN';
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: any): "error" | "warning" | "success" | "default" => {
    if (!severity || typeof severity !== 'string') {
      return 'default';
    }
    
    switch (severity.toLowerCase()) {
      case 'critical':
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
    switch (String(status).toLowerCase()) {
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
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const title = String(incident.title || '');
    const location = String(incident.location?.address || '');
    const type = String(incident.type || '');

    return (
      title.toLowerCase().includes(searchLower) ||
      location.toLowerCase().includes(searchLower) ||
      type.toLowerCase().includes(searchLower)
    );
  }).filter((incident) => {
    if (statusFilter === 'all') return true;
    return incident.status === statusFilter;
  }).filter((incident) => {
    if (severityFilter === 'all') return true;
    return incident.severity === severityFilter;
  });

  const handleStatusUpdate = async (incidentId: string) => {
    if (!newStatus) return;
    
    try {
      setStatusUpdateLoading(true);
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        // If response is not JSON, get the text and throw it
        const text = await response.text();
        throw new Error(`Server error: ${text.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Show success message
      setSuccess('Incident status updated successfully');
      
      // Refresh incidents after update
      await fetchIncidents();
      
      // Reset state
      setStatusUpdateIncident(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update incident status');
    } finally {
      setStatusUpdateLoading(false);
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
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh', pt: 3 }}>
      <Container>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1">
                Transport Incident Management
              </Typography>
              <Box>
                {(session?.user?.userType === 'admin' || session?.user?.userType === 'official') && (
                  <Button
                    href="/analytics"
                    variant="contained"
                    color="info"
                    startIcon={<AnalyticsIcon />}
                    sx={{ mr: 2 }}
                  >
                    Analytics
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/incidents/new')}
                  sx={{ mr: 2 }}
                >
                  New Incident
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Filters Section */}
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                background: 'linear-gradient(to right, #ffffff, #f3f3f7)'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status Filter"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Severity Filter</InputLabel>
                    <Select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      label="Severity Filter"
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/incidents/new')}
                    sx={{ 
                      height: '56px',
                      background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
                      boxShadow: '0 3px 5px 2px rgba(26, 35, 126, .3)'
                    }}
                  >
                    Report New Incident
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Incidents List */}
          {loading ? (
            <Grid item xs={12} sx={{ textAlign: 'center', py: 5 }}>
              <CircularProgress size={60} />
            </Grid>
          ) : filteredIncidents.length === 0 ? (
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: '#fff'
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  No incidents found
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredIncidents.map((incident) => (
              <Grid item xs={12} key={incident._id}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                    mb: 2, 
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            mr: 2,
                            width: 48,
                            height: 48,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          {incident.reportedBy?.name?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                            {incident.reportedBy?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {incident.reportedBy?.email || 'No email provided'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          mb: 2,
                          color: '#2c387e',
                          fontWeight: 500
                        }}
                      >
                        {incident.title}
                      </Typography>
                      {incident.photoUrl && (
                        <Box sx={{ mb: 2, maxWidth: '100%', overflow: 'hidden', borderRadius: 1 }}>
                          <img
                            src={incident.photoUrl}
                            alt="Incident photo"
                            style={{
                              width: '100%',
                              maxHeight: '300px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                          />
                        </Box>
                      )}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                            {incident.location.address}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                            <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                            {incident.type}
                          </Typography>
                        </Grid>
                      </Grid>
                      {incident.description && (
                        <Typography 
                          color="textSecondary" 
                          sx={{ 
                            mb: 2,
                            p: 2,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1
                          }}
                        >
                          {incident.description}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip
                        label={getSeverityText(incident.severity)}
                        color={getSeverityColor(incident.severity)}
                        sx={{ 
                          minWidth: 100,
                          mb: 1 
                        }}
                      />
                      <Chip
                        label={incident.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(incident.status)}
                        sx={{ 
                          minWidth: 100,
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Posted on: {new Date(incident.createdAt).toLocaleDateString()}
                    </Typography>
                    <Box>
                      <Button
                        size="small"
                        startIcon={<CommentIcon />}
                        onClick={() => handleCommentClick(incident)}
                        sx={{ mr: 1 }}
                      >
                        Comments
                      </Button>
                      <Button
                        size="small"
                        startIcon={<LocalHospital />}
                        onClick={() => handleFacilitiesClick(incident)}
                        sx={{ mr: 1 }}
                        variant="contained"
                        color="info"
                      >
                        Nearby Facilities
                      </Button>
                      {/* Show delete button for user's own incidents */}
                      {session?.user?.email === incident.reportedBy.email && (
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(incident._id)}
                          sx={{ mr: 1 }}
                          variant="contained"
                          color="error"
                        >
                          Delete
                        </Button>
                      )}
                      {/* Show update status button for admin/official */}
                      {(session?.user?.userType === 'admin' || session?.user?.userType === 'official') && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => setStatusUpdateIncident(incident)}
                            sx={{ mr: 1 }}
                          >
                            Update Status
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(incident._id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

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
          {loadingFacilities && (
            <CircularProgress
              size={24}
              sx={{ ml: 2, verticalAlign: 'middle' }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {facilities?.hospitals?.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Hospitals
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Distance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facilities.hospitals.map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell>{facility.name}</TableCell>
                        <TableCell>{facility.contact}</TableCell>
                        <TableCell>{facility.location}</TableCell>
                        <TableCell>{facility.estimatedDistance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {facilities?.medicalCamps?.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Medical Camps
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Distance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facilities.medicalCamps.map((facility) => (
                      <TableRow key={facility.id}>
                        <TableCell>{facility.name}</TableCell>
                        <TableCell>{facility.contact}</TableCell>
                        <TableCell>{facility.location}</TableCell>
                        <TableCell>{facility.estimatedDistance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {(!facilities?.hospitals?.length && !facilities?.medicalCamps?.length) && (
            <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
              No nearby facilities found
            </Typography>
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
        onClose={() => {
          setStatusUpdateIncident(null);
          setNewStatus('');
        }}
      >
        <DialogTitle>Update Incident Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
              disabled={statusUpdateLoading}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setStatusUpdateIncident(null);
              setNewStatus('');
            }}
            disabled={statusUpdateLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleStatusUpdate(statusUpdateIncident._id)}
            variant="contained" 
            color="primary"
            disabled={!newStatus || statusUpdateLoading}
          >
            {statusUpdateLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Messages */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            zIndex: 9999 
          }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            zIndex: 9999 
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}
