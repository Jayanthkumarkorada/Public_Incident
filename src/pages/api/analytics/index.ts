import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is an official
    if (session.user.userType !== 'official') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      // Get total incidents count
      const totalIncidents = await db.collection('incidents').countDocuments();

      // Get incidents by type
      const incidentsByType = await db.collection('incidents').aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            type: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]).toArray();

      // Get incidents by severity
      const incidentsBySeverity = await db.collection('incidents').aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            severity: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]).toArray();

      // Get incidents by status
      const incidentsByStatus = await db.collection('incidents').aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            status: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]).toArray();

      // Get recent incidents
      const recentIncidents = await db.collection('incidents')
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      return res.status(200).json({
        totalIncidents,
        incidentsByType,
        incidentsBySeverity,
        incidentsByStatus,
        recentIncidents,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}
