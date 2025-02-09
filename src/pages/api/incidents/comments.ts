import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/db';
import { ObjectId } from 'mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();

    // POST request to add a comment
    if (req.method === 'POST') {
      try {
        const { incidentId, content } = req.body;

        if (!incidentId || !content) {
          return res.status(400).json({ message: 'Incident ID and comment content are required' });
        }

        // Get user details
        const user = await db.collection('users').findOne({
          email: session.user.email
        });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const comment = {
          _id: new ObjectId(),
          content,
          createdAt: new Date(),
          author: {
            _id: user._id,
            name: user.name,
            email: user.email,
          }
        };

        // Add comment to the incident
        const result = await db.collection('incidents').updateOne(
          { _id: new ObjectId(incidentId) },
          { 
            $push: { 
              comments: comment
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Incident not found' });
        }

        return res.status(201).json({
          message: 'Comment added successfully',
          comment
        });
      } catch (error) {
        console.error('Error adding comment:', error);
        return res.status(500).json({
          message: 'Error adding comment',
          error: error.message
        });
      }
    }

    // GET request to fetch comments for an incident
    if (req.method === 'GET') {
      try {
        const { incidentId } = req.query;

        if (!incidentId) {
          return res.status(400).json({ message: 'Incident ID is required' });
        }

        const incident = await db.collection('incidents').findOne(
          { _id: new ObjectId(incidentId as string) },
          { projection: { comments: 1 } }
        );

        if (!incident) {
          return res.status(404).json({ message: 'Incident not found' });
        }

        return res.status(200).json(incident.comments || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({
          message: 'Error fetching comments',
          error: error.message
        });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Top level error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
}
