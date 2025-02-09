import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/db';
import { ObjectId } from 'mongodb';

// Sample data with locations
const allFacilities = {
  hospitals: [
    {
      id: '1',
      name: 'City General Hospital',
      type: 'Government',
      contact: '1234567890',
      location: 'Main Street, City Center',
      area: 'City Center',
      emergencyServices: true,
      ambulanceNumber: '102',
    },
    {
      id: '2',
      name: 'St. Johns Medical Center',
      type: 'Private',
      contact: '9876543210',
      location: 'Park Road, Downtown',
      area: 'Downtown',
      emergencyServices: true,
      ambulanceNumber: '104',
    },
    {
      id: '3',
      name: 'Metro Hospital',
      type: 'Private',
      contact: '5555666677',
      location: 'Lake View Road, Suburb',
      area: 'Suburb',
      emergencyServices: true,
      ambulanceNumber: '105',
    },
  ],
  officials: [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      designation: 'Chief Medical Officer',
      contact: '5555555555',
      jurisdiction: 'City Central',
      area: 'City Center',
    },
    {
      id: '2',
      name: 'Mr. Robert Smith',
      designation: 'Emergency Response Director',
      contact: '6666666666',
      jurisdiction: 'Metropolitan Area',
      area: 'Downtown',
    },
    {
      id: '3',
      name: 'Ms. Emily Brown',
      designation: 'Public Health Director',
      contact: '7777888899',
      jurisdiction: 'Suburban District',
      area: 'Suburb',
    },
  ],
  medicalCamps: [
    {
      id: '1',
      name: 'Central Emergency Camp',
      location: 'City Stadium',
      area: 'City Center',
      capacity: 200,
      services: ['First Aid', 'Emergency Care', 'Vaccination'],
      contact: '7777777777',
    },
    {
      id: '2',
      name: 'Downtown Medical Unit',
      location: 'Community Center',
      area: 'Downtown',
      capacity: 150,
      services: ['Basic Medical Care', 'Testing', 'Pharmacy'],
      contact: '8888888888',
    },
    {
      id: '3',
      name: 'Suburban Relief Camp',
      location: 'Public Park',
      area: 'Suburb',
      capacity: 100,
      services: ['First Aid', 'Basic Care'],
      contact: '9999900000',
    },
  ],
};

function normalizeLocation(location: string): string {
  return location.toLowerCase().trim();
}

function findAreaFromLocation(location: string): string {
  const normalizedLocation = normalizeLocation(location);
  
  // Define area keywords
  const areaKeywords = {
    'city center': ['central', 'city', 'main street', 'center'],
    'downtown': ['downtown', 'park road', 'business'],
    'suburb': ['suburb', 'lake view', 'residential', 'park'],
  };

  // Find matching area
  for (const [area, keywords] of Object.entries(areaKeywords)) {
    if (keywords.some(keyword => normalizedLocation.includes(keyword))) {
      return area;
    }
  }

  return 'unknown';
}

function filterFacilitiesByLocation(location: string) {
  const area = findAreaFromLocation(location);
  
  if (area === 'unknown') {
    // If area is unknown, return all facilities
    return allFacilities;
  }

  return {
    hospitals: allFacilities.hospitals.filter(
      hospital => normalizeLocation(hospital.area) === area
    ),
    officials: allFacilities.officials.filter(
      official => normalizeLocation(official.area) === area
    ),
    medicalCamps: allFacilities.medicalCamps.filter(
      camp => normalizeLocation(camp.area) === area
    ),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.method === 'GET') {
      const { location } = req.query;

      if (!location) {
        return res.status(400).json({ message: 'Location is required' });
      }

      const nearbyFacilities = filterFacilitiesByLocation(location as string);

      // Add distance information (in a real app, this would be actual distances)
      const facilitiesWithDistance = {
        hospitals: nearbyFacilities.hospitals.map(hospital => ({
          ...hospital,
          estimatedDistance: '< 5 km',
        })),
        officials: nearbyFacilities.officials.map(official => ({
          ...official,
          responseTime: '10-15 minutes',
        })),
        medicalCamps: nearbyFacilities.medicalCamps.map(camp => ({
          ...camp,
          estimatedDistance: '< 3 km',
        })),
      };

      return res.status(200).json(facilitiesWithDistance);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in facilities API:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}
