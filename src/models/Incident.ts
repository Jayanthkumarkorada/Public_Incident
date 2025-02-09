import { ObjectId } from 'mongodb';

export interface Incident {
  _id?: ObjectId;
  title: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved';
  imageUrl?: string;
  reportedBy: {
    _id: ObjectId;
    name: string;
    email: string;
  };
  comments: Array<{
    _id?: ObjectId;
    userId: ObjectId;
    userName: string;
    content: string;
    createdAt: Date;
  }>;
  nearbyFacilities?: {
    hospitals?: Array<{
      name: string;
      distance: number;
      location: {
        lat: number;
        lng: number;
      };
    }>;
    officials?: Array<{
      name: string;
      role: string;
      contact: string;
    }>;
    medicalCamps?: Array<{
      name: string;
      location: {
        lat: number;
        lng: number;
      };
      services: string[];
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}
