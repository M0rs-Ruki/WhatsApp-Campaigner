import { Request, Response, NextFunction } from 'express';
import User, { UserStatus } from '../Models/user.Model.js';

const checkUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Block deleted users
        if (user.status === UserStatus.DELETED) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deleted.',
            });
        }

        // Block frozen/inactive users
        if (user.status === UserStatus.INACTIVE) {
            return res.status(403).json({
                success: false,
                message: 'Your account is frozen. Contact support.',
            });
        }

        next();
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};

export default checkUserStatus;