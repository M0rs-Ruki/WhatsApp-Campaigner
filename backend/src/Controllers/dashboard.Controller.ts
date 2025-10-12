import type { Request, Response } from 'express';
import { IUser, UserRole } from '../Models/user.Model.js';
import mongoose from 'mongoose';
import Campaign from '../Models/Campaign.model.js';
import Transaction from '../Models/transaction.Model.js';
import User from '../Models/user.Model.js';
import News from '../Models/news.Model.js';
import Complaint from '../Models/complaints.Model.js';



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

        const userId = new mongoose.Types.ObjectId(user._id);
        const currentYear = new Date().getFullYear();

        // -------------------- Total messages across all campaigns --------------------
        const totalMessagesAgg = await Campaign.aggregate([
            { $match: { createdBy: userId } },
            { $group: { _id: null, totalMessages: { $sum: '$numberCount' } } }
        ]);
        const totalMessages = totalMessagesAgg[0]?.totalMessages || 0;

        // -------------------- Monthly messages aggregation --------------------
        const monthlyAgg = await Campaign.aggregate([
            { $match: { createdBy: userId } },
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

        // -------------------- Cumulative messages --------------------
        let cumulative = 0;
        const monthlyStatsWithCumulative = monthlyAgg.map(m => ({
            month: m.month,
            totalMessages: m.totalMessages,
            cumulativeMessages: cumulative += m.totalMessages
        }));

        // -------------------- Top 5 campaigns in the current year --------------------
        const topFiveCampaigns = await Campaign.find({
            createdBy: userId,
            createdAt: { 
                $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
            }
        })
        .sort({ numberCount: -1 })  // highest numberCount first
        .limit(5)
        .select('campaignName numberCount createdAt')  // only send necessary fields
        .lean();

        // -------------------- Return response --------------------
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
                monthlyStats: monthlyStatsWithCumulative, // ready for React charts
                topFiveCampaigns: topFiveCampaigns      // top 5 campaigns this year
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


const transaction = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        const userId = user._id;

        // Get current user for balance
        const currentUser = await User.findById(userId).select('balance companyName');
        
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Fetch last 100 transactions for this user
        const transactions = await Transaction.find({
            $or: [
                { receiverId: userId },
                { senderId: userId }
            ]
        })
            .sort({ transactionDate: -1 }) // Most recent first
            .limit(100)
            .populate('senderId', 'companyName') // Get sender's company name
            .populate('campaignId', 'campaignName') // Get campaign name
            .lean();

        // Format transactions for frontend
        const formattedTransactions = transactions.map((transaction: any) => {
            const isCredit = transaction.type === 'credit';
            const isDebit = transaction.type === 'debit';

            // userOrCampaign: sender name (credit) or campaign name (debit)
            let userOrCampaign = '';
            if (isCredit && transaction.senderId) {
                userOrCampaign = transaction.senderId.companyName || 'Unknown User';
            } else if (isDebit && transaction.campaignId) {
                userOrCampaign = transaction.campaignId.campaignName || 'Unknown Campaign';
            } else {
                userOrCampaign = isCredit ? 'Credit Transaction' : 'Debit Transaction';
            }

            // createdBy: sender name (credit) or current user's name (debit)
            let createdBy = '';
            if (isCredit && transaction.senderId) {
                createdBy = transaction.senderId.companyName || 'Unknown User';
            } else if (isDebit) {
                createdBy = currentUser.companyName;
            }

            return {
                transactionId: transaction._id,
                userOrCampaign,
                amount: transaction.amount,
                type: transaction.type,
                createdBy,
                createdAt: transaction.transactionDate,
                status: transaction.status,
                balanceBefore: transaction.balanceBefore,
                balanceAfter: transaction.balanceAfter
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                currentBalance: currentUser.balance,
                totalTransactions: formattedTransactions.length,
                transactions: formattedTransactions
            }
        });

    } catch (error: unknown) {
        console.error('Error in transaction controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in transaction controller.',
        });
    }
}

const news = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        // Fetch last 50 news items (both ACTIVE and INACTIVE)
        const allNews = await News.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('createdBy', 'companyName')
            .lean();
        
        // Format news for frontend
        const formattedNews = allNews.map((newsItem: any) => ({
            id: newsItem._id,
            title: newsItem.title,
            description: newsItem.description,
            status: newsItem.status,
            createdBy: newsItem.createdBy?.companyName || 'Unknown',
            createdAt: newsItem.createdAt,
            updatedAt: newsItem.updatedAt
        }));

        return res.status(200).json({
            success: true,
            message: 'News fetched successfully.',
            data: {
                totalNews: formattedNews.length,
                news: formattedNews
            },
        });

    } catch (error) {
        console.error('Error in news controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in news controller.',
        });
    }
}

const complaints = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        const userId = user._id;
        const userRole = user.role;

        // Determine which complaints to fetch
        // Admin sees all complaints, regular users see only their own
        const queryFilter = userRole === UserRole.ADMIN 
            ? {} 
            : { createdBy: userId };

        // Fetch complaints
        const allComplaints = await Complaint.find(queryFilter)
            .sort({ createdAt: -1 }) // Most recent first
            .limit(100) // Last 100 complaints
            .populate('createdBy', 'companyName') // Get creator's company name
            .populate('resolvedBy', 'companyName') // Get resolver's company name
            .lean();

        // Format complaints for frontend
        const formattedComplaints = allComplaints.map((complaint: any) => ({
            complaintId: complaint._id,
            subject: complaint.subject,
            description: complaint.description,
            status: complaint.status,
            createdBy: complaint.createdBy?.companyName || 'Unknown User',
            createdAt: complaint.createdAt,
            adminResponse: complaint.adminResponse || null,
            resolvedBy: complaint.resolvedBy?.companyName || null,
            resolvedAt: complaint.resolvedAt || null,
            updatedAt: complaint.updatedAt
        }));

        // Calculate status breakdown
        const statusBreakdown = {
            pending: formattedComplaints.filter(c => c.status === 'pending').length,
            inProgress: formattedComplaints.filter(c => c.status === 'in-progress').length,
            resolved: formattedComplaints.filter(c => c.status === 'resolved').length,
            closed: formattedComplaints.filter(c => c.status === 'closed').length
        };

        return res.status(200).json({
            success: true,
            message: 'Complaints fetched successfully.',
            data: {
                totalComplaints: formattedComplaints.length,
                statusBreakdown,
                complaints: formattedComplaints
            }
        });

    } catch (error: unknown) {
        console.error('Error in complaints controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in complaints controller.',
        });
    }
}



export { businessDetails, dashboard, transaction, news, complaints };