import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  }
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Extracted token:', token ? token.substring(0, 20) + '...' : 'none');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('JWT_SECRET not configured');
    }

    try {
      console.log('Attempting to verify token...');
      const decoded = jwt.verify(token, secretKey) as { userId: string };
      console.log('Token verified, userId:', decoded.userId);
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      throw new Error('Invalid token');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      message: 'Authentication required', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};