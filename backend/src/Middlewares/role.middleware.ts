// src/middleware/role.Middleware.ts
import { Request, Response, NextFunction } from 'express';

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

const isReseller = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'reseller') {
    return res.status(403).json({ message: 'Forbidden: Reseller access required' });
  }
  next();
};

const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'user') {
    return res.status(403).json({ message: 'Forbidden: User access required' });
  }
  next();
};


export { isAdmin, isReseller, isUser };