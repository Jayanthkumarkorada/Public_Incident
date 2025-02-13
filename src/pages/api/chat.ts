// src/pages/api/chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NextApiRequest, NextApiResponse } from 'next';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a specialized legal assistant for transport incidents and safety regulations. Your role is to:
1. Provide accurate information about transport laws and regulations
2. Guide users through incident reporting procedures
3. Explain legal rights and responsibilities in transport-related incidents
4. Offer safety guidelines and best practices
5. Help understand the legal implications of transport incidents

Please keep responses clear, concise, and focused on transport-related legal matters.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Message is required and must be a string' 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `${SYSTEM_PROMPT}\n\nUser Query: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from AI model');
    }

    res.status(200).json({ 
      response: text,
      status: 'success' 
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Handle different types of errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'The service is not properly configured. Please contact support.'
      });
    }

    if (error.message?.includes('quota')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'The service is temporarily unavailable. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}