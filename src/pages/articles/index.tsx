import { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const trafficArticles = [
  {
    title: 'Understanding Road Signs',
    content: 'Road signs are essential communication tools that help regulate traffic flow and ensure safety. Learn about different categories of signs: regulatory signs (like stop and yield), warning signs (for hazards), and informational signs (directions and services).',
  },
  {
    title: 'Safe Driving in Adverse Weather',
    content: 'Weather conditions significantly impact driving safety. Reduce speed in rain or fog, maintain safe following distance, use appropriate lights, and ensure your vehicle is properly maintained with good tire tread and working wipers.',
  },
  {
    title: 'Defensive Driving Techniques',
    content: 'Defensive driving means anticipating potential hazards and maintaining awareness of surrounding traffic. Stay alert, check mirrors regularly, and always have an escape route planned.',
  },
];

const safetyPrecautions = [
  {
    title: 'Vehicle Maintenance Checklist',
    content: 'Regular vehicle maintenance is crucial for safety. Check brakes, tires, lights, and fluid levels monthly. Keep an emergency kit in your vehicle with basic tools, first aid supplies, and emergency contact numbers.',
  },
  {
    title: 'Pedestrian Safety Guidelines',
    content: 'Always use designated crosswalks, obey traffic signals, and make eye contact with drivers before crossing. Wear reflective clothing when walking at night and stay alert for vehicles.',
  },
  {
    title: 'Emergency Response Protocol',
    content: 'In case of an accident: 1) Stay calm and assess the situation, 2) Call emergency services immediately, 3) Dont move injured persons unless absolutely necessary, 4) Document the scene if possible, 5) Exchange information with other parties involved.',
  },
  {
    title: 'Child Safety in Vehicles',
    content: 'Always use appropriate child restraints and car seats based on age and size. Never leave children unattended in vehicles, and teach them basic road safety rules from an early age.',
  },
];

export default function Articles() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Traffic Safety Resources
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Traffic Articles" />
          <Tab label="Safety Precautions" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {trafficArticles.map((article, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {article.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {article.content}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {safetyPrecautions.map((precaution, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {precaution.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {precaution.content}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
}
