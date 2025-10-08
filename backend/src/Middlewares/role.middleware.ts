import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../Models/user.Model.js';

const hasAuthority = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.RESELLER) {
    return next();
  }

  return res.status(403).json({ 
    success: false,
    message: 'You don\'t have the authority to perform this action' 
  });
};

export { hasAuthority };
