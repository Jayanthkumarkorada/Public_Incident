import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/db';
import { ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

    const { db } = await connectToDatabase();

    // GET request to fetch all incidents
    if (req.method === 'GET') {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
          query = {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { 'location.address': { $regex: search, $options: 'i' } },
              { type: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          };
        }

        const [rawIncidents, total] = await Promise.all([
          db.collection('incidents')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          db.collection('incidents').countDocuments(query)
        ]);

        // Ensure all incidents have the required fields with proper types
        const incidents = rawIncidents.map(incident => ({
          _id: incident._id,
          title: String(incident.title || ''),
          location: {
            address: String(incident.location?.address || '')
          },
          type: String(incident.type || ''),
          severity: String(incident.severity || ''),
          status: String(incident.status || 'pending'),
          description: String(incident.description || ''),
          photoUrl: incident.photoUrl || null,
          reportedBy: {
            name: String(incident.reportedBy?.name || ''),
            email: String(incident.reportedBy?.email || '')
          },
          createdAt: incident.createdAt ? new Date(incident.createdAt).toISOString() : new Date().toISOString(),
          comments: Array.isArray(incident.comments) ? incident.comments : []
        }));

        return res.status(200).json({
          incidents,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        });
      } catch (error) {
        console.error('Error fetching incidents:', error);
        return res.status(500).json({
          message: 'Error fetching incidents',
          error: error.message,
        });
      }
    }

    // POST request to create a new incident
    if (req.method === 'POST') {
      try {
        const form = formidable({
          uploadDir,
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB limit
        });

        const [fields, files] = await new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve([fields, files]);
          });
        });

        // Validate required fields
        if (!fields.title || !fields.location || !fields.type || !fields.severity) {
          return res.status(400).json({
            message: 'Missing required fields',
            receivedData: { title: fields.title, location: fields.location, type: fields.type, severity: fields.severity }
          });
        }

        // Get user details from the database
        const user = await db.collection('users').findOne({
          email: session.user.email
        });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        let photoUrl = null;
        if (files.photo) {
          const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
          const fileName = path.basename(file.filepath);
          photoUrl = `/uploads/${fileName}`;
        }

        const incident = {
          title: fields.title,
          location: {
            address: fields.location,
            coordinates: null,
          },
          type: fields.type,
          severity: fields.severity,
          description: fields.description || '',
          photoUrl,
          status: 'pending',
          reportedBy: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          comments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await db.collection('incidents').insertOne(incident);
        
        return res.status(201).json({
          message: 'Incident created successfully',
          incident: { ...incident, _id: result.insertedId },
        });
      } catch (error) {
        console.error('Error creating incident:', error);
        return res.status(500).json({
          message: 'Could not create incident',
          error: error.message,
        });
      }
    }

    // PATCH request to update incident status
    if (req.method === 'PATCH') {
      try {
        // Only officials can update status
        if (session.user.userType !== 'official') {
          return res.status(403).json({ message: 'Not authorized to update incident status' });
        }

        const { id, status } = req.body;

        if (!id || !status) {
          return res.status(400).json({ message: 'Incident ID and status are required' });
        }

        const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }

        const result = await db.collection('incidents').updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              status,
              updatedAt: new Date(),
              updatedBy: {
                email: session.user.email,
                name: session.user.name,
              },
            },
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Incident not found' });
        }

        return res.status(200).json({ message: 'Incident status updated successfully' });
      } catch (error) {
        console.error('Error updating incident status:', error);
        return res.status(500).json({
          message: 'Error updating incident status',
          error: error.message,
        });
      }
    }

    // DELETE request to remove an incident
    if (req.method === 'DELETE') {
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ message: 'Incident ID is required' });
        }

        // Get the incident to check permissions
        const incident = await db.collection('incidents').findOne({
          _id: new ObjectId(id as string),
        });

        if (!incident) {
          return res.status(404).json({ message: 'Incident not found' });
        }

        // Allow deletion if user is the owner or an official
        if (incident.reportedBy.email !== session.user.email && session.user.userType !== 'official') {
          return res.status(403).json({ message: 'Not authorized to delete this incident' });
        }

        // Delete the incident
        await db.collection('incidents').deleteOne({
          _id: new ObjectId(id as string),
        });

        return res.status(200).json({ message: 'Incident deleted successfully' });
      } catch (error) {
        console.error('Error deleting incident:', error);
        return res.status(500).json({
          message: 'Error deleting incident',
          error: error.message,
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
