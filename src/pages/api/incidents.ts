import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { connectToDatabase } from '../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { db } = await connectToDatabase();

  // Handle GET request for fetching incidents
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      // Build query
      let query: any = {};
      
      // Add search filter if provided
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } }
        ];
      }

      // Get total count for pagination
      const total = await db.collection('incidents').countDocuments(query);

      // Get incidents with pagination
      const incidents = await db.collection('incidents')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return res.status(200).json({
        incidents,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return res.status(500).json({ message: 'Error fetching incidents' });
    }
  }

  // Handle DELETE request
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid incident ID' });
    }

    try {
      // First, get the incident to check ownership
      const incident = await db.collection('incidents').findOne({
        _id: new ObjectId(id)
      });

      if (!incident) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      // Check if user is authorized to delete (owner or admin/official)
      if (
        incident.reportedBy.email !== session.user.email &&
        session.user.userType !== 'admin' &&
        session.user.userType !== 'official'
      ) {
        return res.status(403).json({ message: 'Not authorized to delete this incident' });
      }

      // Delete the incident
      const result = await db.collection('incidents').deleteOne({
        _id: new ObjectId(id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      return res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (error) {
      console.error('Error deleting incident:', error);
      return res.status(500).json({ message: 'Error deleting incident' });
    }
  }

  // Return 405 for other methods
  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
