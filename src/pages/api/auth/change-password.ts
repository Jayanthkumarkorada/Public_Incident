import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { connectToDatabase } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters long' });
  }

  const client = await connectToDatabase();
  const usersCollection = client.db().collection('users');

  const user = await usersCollection.findOne({ email: session.user.email });

  if (!user) {
    client.close();
    return res.status(404).json({ message: 'User not found' });
  }

  const currentPasswordIsValid = await verifyPassword(
    currentPassword,
    user.password
  );

  if (!currentPasswordIsValid) {
    client.close();
    return res.status(403).json({ message: 'Current password is incorrect' });
  }

  const hashedPassword = await hashPassword(newPassword);

  await usersCollection.updateOne(
    { email: session.user.email },
    { $set: { password: hashedPassword } }
  );

  client.close();
  res.status(200).json({ message: 'Password updated successfully' });
}
