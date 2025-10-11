import type { Request, Response } from 'express';
import { IUser } from '../Models/user.Model.js';


declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const businessDetails = (req: Request, res: Response) => {
    try {
        
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                companyName: user.companyName,
                userID: user.userID,
                email: user.email,
                image: user.image,
                number: user.number,
                role: user.role,
                balance: user.balance,
                status: user.status,
                createdAt: user.createdAt,
            },
        });

    } catch (error: unknown) {
        console.error('Error in businessDetails controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred.',
        });
    }
}

export default businessDetails;