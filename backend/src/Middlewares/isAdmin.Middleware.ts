
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../Models/user.Model.js';


const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        if (req.user.role === UserRole.ADMIN) {
            next();
            return;
        }
        res.status(403).json({
            success: false,
            message: 'You do not have the authority to perform this action',
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred During admin check';
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: errorMessage,
        });
    }
}

export default isAdmin;