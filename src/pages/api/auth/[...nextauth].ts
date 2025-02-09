import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDatabase } from '../../../lib/db';
import { verifyPassword } from '../../../lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { db } = await connectToDatabase();
          
          const user = await db.collection('users').findOne({
            email: credentials.email.toLowerCase(),
          });

          if (!user) {
            throw new Error('No user found with this email');
          }

          const isValid = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            userType: user.userType,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.userType = token.userType;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
