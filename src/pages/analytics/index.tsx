import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  totalIncidents: number;
  incidentsByType: {
    type: string;
    count: number;
  }[];
  incidentsBySeverity: {
    severity: string;
    count: number;
  }[];
  incidentsByStatus: {
    status: string;
    count: number;
  }[];
  recentIncidents: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    } else if (status === 'authenticated' && session?.user?.userType !== 'official') {
      router.replace('/dashboard');
    } else if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, router, session]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session || session.user.userType !== 'official') {
    return null;
  }

  const incidentsByTypeData = {
    labels: analyticsData?.incidentsByType.map(item => item.type) || [],
    datasets: [
      {
        label: 'Number of Incidents',
        data: analyticsData?.incidentsByType.map(item => item.count) || [],
        backgroundColor: COLORS[0],
      },
    ],
  };

  const severityData = {
    labels: analyticsData?.incidentsBySeverity.map(item => item.severity) || [],
    datasets: [
      {
        data: analyticsData?.incidentsBySeverity.map(item => item.count) || [],
        backgroundColor: COLORS,
      },
    ],
  };

  const statusData = {
    labels: analyticsData?.incidentsByStatus.map(item => item.status) || [],
    datasets: [
      {
        data: analyticsData?.incidentsByStatus.map(item => item.count) || [],
        backgroundColor: COLORS,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Incidents
              </Typography>
              <Typography variant="h3">
                {analyticsData?.totalIncidents || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Incidents by Type Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Incidents by Type
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <Bar data={incidentsByTypeData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Severity Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Severity Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={severityData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={statusData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Incidents Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Incidents
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Reported By</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData?.recentIncidents.map((incident) => (
                    <TableRow key={incident._id}>
                      <TableCell>{incident.title}</TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>{incident.severity}</TableCell>
                      <TableCell>{incident.status}</TableCell>
                      <TableCell>{incident.location.address}</TableCell>
                      <TableCell>{incident.reportedBy.name}</TableCell>
                      <TableCell>
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
