# Public Transport Incident Reporter

A full-stack web application for reporting and managing public transport incidents. Built with Next.js, React, MongoDB, and Node.js.

## Features

- User Authentication (Public and Official users)
- Incident Reporting System
- Real-time Incident Tracking
- Analytics Dashboard for Officials
- Severity-based Incident Categorization
- Status Tracking for Incidents

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## User Types

### Public Users
- View incidents
- Report new incidents
- Track incident status
- Comment on incidents
- Search incidents by type and location
- View nearby facilities
- Delete own posts

### Official Users
- Access analytics dashboard
- Update incident status
- Manage all incidents
- View user profiles
- Delete inappropriate content

## Tech Stack

- Frontend: Next.js, React, Material-UI
- Backend: Node.js, Next.js API Routes
- Database: MongoDB
- Authentication: NextAuth.js
- Charts: Chart.js
