import type { Request, Response } from 'express';
import { IUser } from '../Models/user.Model.js';
import mongoose from 'mongoose';
import Campaign from '../Models/Campaign.model.js';



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

const dashboard = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        // Total messages across all campaigns
        const totalMessagesAgg = await Campaign.aggregate([
            { $match: { createdBy: new mongoose.Types.ObjectId(user._id) } },
            { $group: { _id: null, totalMessages: { $sum: '$numberCount' } } }
        ]);
        const totalMessages = totalMessagesAgg[0]?.totalMessages || 0;

        // Monthly messages aggregation
        const monthlyAgg = await Campaign.aggregate([
            { $match: { createdBy: new mongoose.Types.ObjectId(user._id) } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    totalMessages: { $sum: '$numberCount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: '$_id.year' },
                            '-',
                            {
                                $cond: [
                                    { $lt: ['$_id.month', 10] },
                                    { $concat: ['0', { $toString: '$_id.month' }] },
                                    { $toString: '$_id.month' }
                                ]
                            }
                        ]
                    },
                    totalMessages: 1
                }
            }
        ]);

        // Calculate cumulative messages
        let cumulative = 0;
        const monthlyStatsWithCumulative = monthlyAgg.map(m => ({
            month: m.month,
            totalMessages: m.totalMessages,
            cumulativeMessages: cumulative += m.totalMessages
        }));

        return res.status(200).json({
            success: true,
            data: {
                companyName: user.companyName,
                image: user.image,
                role: user.role,
                balance: user.balance,
                totalReseller: user.allReseller.length,
                totalUsers: user.allUsers.length,
                allReseller: user.allReseller,
                allUsers: user.allUsers,
                allCampaign: user.allCampaign,
                totalCampaigns: user.totalCampaigns,
                totalMessages: totalMessages,
                monthlyStats: monthlyStatsWithCumulative // ✅ ready for React charts
            }
        });

    } catch (error: unknown) {
        console.error('Error in dashboard controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in Dashboard controller.',
        });
    }
};


export { businessDetails, dashboard };