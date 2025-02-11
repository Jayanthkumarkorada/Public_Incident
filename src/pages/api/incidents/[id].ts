import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid incident ID' });
  }

  const { db } = await connectToDatabase();

  // Handle DELETE request
  if (req.method === 'DELETE') {
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

  // Handle PATCH request for updating status
  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      // Validate status value
      const validStatuses = ['pending', 'in_progress', 'resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Check if user is authorized to update status (admin or official only)
      if (session.user.userType !== 'admin' && session.user.userType !== 'official') {
        return res.status(403).json({ message: 'Not authorized to update incident status' });
      }

      const result = await db.collection('incidents').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating incident status:', error);
      return res.status(500).json({ message: 'Error updating incident status' });
    }
  }

  // Return 405 for other methods
  res.setHeader('Allow', ['DELETE', 'PATCH']);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}
