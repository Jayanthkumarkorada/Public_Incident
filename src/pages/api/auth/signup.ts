import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, userType, adminKey } = req.body;

    // Validate input
    if (
      !email ||
      !email.includes('@') ||
      !password ||
      password.trim().length < 7 ||
      !name ||
      !userType ||
      !['public', 'official'].includes(userType)
    ) {
      return res.status(422).json({
        message:
          'Invalid input - password should be at least 7 characters long.',
      });
    }

    // Verify admin key for official users
    if (userType === 'official') {
      if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({
          message: 'Invalid admin key. Official registration denied.',
        });
      }
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db
      .collection('users')
      .findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(422).json({ message: 'User already exists!' });
    }

    const hashedPassword = await hashPassword(password);

    // Create new user
    const result = await db.collection('users').insertOne({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Created user!', userId: result.insertedId });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Could not create user.', error: error.message });
  }
}
