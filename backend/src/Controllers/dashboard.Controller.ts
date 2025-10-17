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

interface SupportResponse {
    companyName: string;
    email: string;
    number: string;
    role: UserRole;
    status: string;
    image?: string;
}
interface UserDocument {
    companyName: string;
    email: string;
    number: string;
    image?: string;
    role: UserRole;
    status: string;
    createdAt: Date;

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



        // ✅ LATEST NEWS (active preferred, fallback to any latest)
        let latestNews = await News.findOne({
        status: { $regex: /^active$/i }   // case-insensitive match: ACTIVE, Active, active
        })
        .sort({ createdAt: -1 })          // newest first
        .populate('createdBy', 'companyName')
        .select('title description status createdAt createdBy')
        .lean();

        // Fallback: if no ACTIVE news exists, take the newest item regardless of status
        if (!latestNews) {
        latestNews = await News.findOne({})
            .sort({ createdAt: -1 })
            .populate('createdBy', 'companyName')
            .select('title description status createdAt createdBy')
            .lean();
        }

        const formattedLatestNews = latestNews
        ? {
            title: latestNews.title,
            description: latestNews.description,
            status: latestNews.status,
            createdAt: latestNews.createdAt,
            }
        : null;


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
                totalCampaigns: user.totalCampaigns,
                totalMessages: totalMessages,
                monthlyStats: monthlyStatsWithCumulative,
                topFiveCampaigns: topFiveCampaigns,
                latestNews: formattedLatestNews  // ✅ MOVED INSIDE data object!
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

        const userId = user._id.toString();

        const currentUser = await User.findById(userId).select('balance companyName allTransaction');

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const transactions = await Transaction.find({
            _id: { $in: currentUser.allTransaction }
        })
            .sort({ transactionDate: -1 })
            .limit(100)
            .populate('senderId', 'companyName')
            .populate('receiverId', 'companyName')
            .populate('campaignId', 'campaignName')
            .lean();

        const formattedTransactions = transactions.map((transaction: any) => {
            const transactionType = transaction.type;
        
            let userOrCampaign = '';
            let createdBy = '';
            let displayType = '';
        
            if (transactionType === 'credit') {
                displayType = 'credit';
                userOrCampaign = transaction.senderId?.companyName || 'Unknown';
                createdBy = transaction.receiverId?.companyName || 'Unknown';
            }
            else if (transactionType === 'debit') {
                displayType = 'debit';
        
                if (transaction.campaignId) {
                    userOrCampaign = transaction.campaignId.campaignName || 'Campaign';
                    createdBy = currentUser.companyName;
                } else {
                    const senderId = transaction.senderId?._id?.toString();
        
                    if (senderId === userId) {
                        userOrCampaign = transaction.receiverId?.companyName || 'Unknown';
                        createdBy = currentUser.companyName;
                    } else {
                        userOrCampaign = transaction.senderId?.companyName || 'System';
                        createdBy = transaction.receiverId?.companyName || 'System';
                    }
                }
            }
        
            return {
                transactionId: transaction._id,
                userOrCampaign,
                amount: transaction.amount,
                type: displayType,
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
        // Admin, Reseller, and User all see all complaints
        const queryFilter = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER || userRole === UserRole.USER
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


const manageReseller = async (req: Request, res: Response) => {
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

        // Check if user is admin or reseller
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.RESELLER) {
            return res.status(403).json({
                success: false,
                message: 'Only admin and reseller can access this section.',
            });
        }

        // Get current user with populated allReseller array
        const currentUser = await User.findById(userId)
            .populate('allReseller')
            .lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Get all resellers created by this admin/reseller
        const resellers = currentUser.allReseller as any[];

        // Format reseller data
        const formattedResellers = resellers.map((reseller: any) => ({
            id: reseller._id,
            companyName: reseller.companyName,
            email: reseller.email,
            image: reseller.image,
            number: reseller.number,
            role: reseller.role,
            resellerCount: reseller.allReseller?.length || 0,
            userCount: reseller.allUsers?.length || 0,
            totalCampaigns: reseller.totalCampaigns || 0,
            balance: reseller.balance || 0,
            status: reseller.status,
            createdAt: reseller.createdAt
        }));

        // Sort by most recent first
        formattedResellers.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return res.status(200).json({
            success: true,
            message: 'Resellers fetched successfully.',
            data: {
                totalResellers: formattedResellers.length,
                resellers: formattedResellers
            },
        });

    } catch (error: unknown) {
        console.error('Error in manageReseller controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in manageReseller controller.',
        });
    }
}

const manageUser = async (req: Request, res: Response) => {
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

        // Check if user is admin or reseller
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.RESELLER) {
            return res.status(403).json({
                success: false,
                message: 'Only admin and reseller can access this section.',
            });
        }

        // Get current user with populated allUsers array
        const currentUser = await User.findById(userId)
            .populate('allUsers')
            .lean();

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Get all users created by this admin/reseller
        const users = currentUser.allUsers as any[];

        // Format user data
        const formattedUsers = users.map((user: any) => ({
            id: user._id,
            companyName: user.companyName,
            email: user.email,
            number: user.number,
            image: user.image,
            role: user.role,
            resellerCount: user.allReseller?.length || 0,
            userCount: user.allUsers?.length || 0,
            totalCampaigns: user.totalCampaigns || 0,
            balance: user.balance || 0,
            status: user.status,
            createdAt: user.createdAt
        }));

        // Sort by most recent first
        formattedUsers.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return res.status(200).json({
            success: true,
            message: 'Users fetched successfully.',
            data: {
                totalUsers: formattedUsers.length,
                users: formattedUsers
            },
        });

    } catch (error: unknown) {
        console.error('Error in manageUser controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in manageUser controller.',
        });
    }
}

const treeView = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        const userId = user._id;

        // Recursive function to build tree (max 3 levels)
        const buildTree = async (userId: string, currentLevel: number): Promise<any> => {
            // Stop at level 3
            if (currentLevel > 3) {
                return null;
            }

            // Fetch user data
            const user = await User.findById(userId)
                .select('companyName email number role balance totalCampaigns status allReseller allUsers createdAt')
                .lean();

            if (!user) {
                return null;
            }

            // Get resellers and users (limit to 20 each, no sorting for performance)
            const resellerIds = user.allReseller?.slice(0, 10) || [];
            const userIds = user.allUsers?.slice(0, 10) || [];

            // Build node data
            const node: any = {
                id: user._id,
                companyName: user.companyName,
                email: user.email,
                number: user.number,
                role: user.role,
                balance: user.balance,
                totalCampaigns: user.totalCampaigns,
                status: user.status,
                directResellers: user.allReseller?.length || 0,
                directUsers: user.allUsers?.length || 0,
                level: currentLevel,
                children: []
            };

            // Only fetch children if not at max depth
            if (currentLevel < 3) {
                // Fetch resellers recursively
                for (const resellerId of resellerIds) {
                    const resellerNode = await buildTree(resellerId.toString(), currentLevel + 1);
                    if (resellerNode) {
                        node.children.push(resellerNode);
                    }
                }

                // Fetch users (users don't have children, so just add their data)
                const users = await User.find({ _id: { $in: userIds } })
                    .select('companyName email number role balance totalCampaigns status')
                    .limit(20)
                    .lean();

                for (const childUser of users) {
                    node.children.push({
                        id: childUser._id,
                        companyName: childUser.companyName,
                        email: childUser.email,
                        number: childUser.number,
                        role: childUser.role,
                        balance: childUser.balance,
                        totalCampaigns: childUser.totalCampaigns,
                        status: childUser.status,
                        directResellers: 0,
                        directUsers: 0,
                        level: currentLevel + 1,
                        children: [] // Users can't create others
                    });
                }
            }

            return node;
        };

        // Calculate total count recursively
        const calculateTotal = (node: any): number => {
            if (!node) return 0;
            
            let count = node.children.length; // Direct children
            
            // Add all descendants
            for (const child of node.children) {
                count += calculateTotal(child);
            }
            
            return count;
        };

        // Build tree starting from logged-in user
        const tree = await buildTree(userId.toString(), 0);

        if (!tree) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Calculate total network size
        const totalCount = calculateTotal(tree);

        return res.status(200).json({
            success: true,
            message: 'Tree view fetched successfully.',
            data: {
                totalCount,
                tree
            }
        });

    } catch (error: unknown) {
        console.error('Error in treeView controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in treeView controller.',
        });
    }
};

const whatsAppReports = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        const userId = user._id;

        // Get current user to access their campaigns
        const currentUser = await User.findById(userId).select('companyName allCampaign');
        
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        // Fetch all campaigns created by this user
        const campaigns = await Campaign.find({
            _id: { $in: currentUser.allCampaign }
        })
            .sort({ createdAt: -1 }) // Most recent first
            .populate('createdBy', 'companyName') // Get creator's company name
            .lean();

        // Format campaigns for frontend
        const formattedCampaigns = campaigns.map((campaign: any) => ({
            campaignId: campaign._id,
            campaignName: campaign.campaignName,
            message: campaign.message,
            createdBy: campaign.createdBy?.companyName || currentUser.companyName,
            mobileNumberCount: campaign.mobileNumbers?.length || 0,
            createdAt: campaign.createdAt,
            image: campaign.media?.url || campaign.media || null,
        }));

        return res.status(200).json({
            success: true,
            message: 'WhatsApp reports fetched successfully.',
            data: {
                totalCampaigns: formattedCampaigns.length,
                campaigns: formattedCampaigns
            },
            userData: {
                companyName: user.companyName,
                email: user.email,
                number: user.number,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
            }
        });

    } catch (error: unknown) {
        console.error('Error in whatsAppReports controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in whatsAppReports controller.',
        });
    }
};

const allCampaigns = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
            });
        }

        // Fetch latest 50 campaigns sorted by creation date (newest first)
        const campaigns = await Campaign.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('createdBy', 'companyName email number role status createdAt')
            .lean();

        // Format campaigns for frontend
        const formattedCampaigns = campaigns.map((campaign: any) => ({
            campaignId: campaign._id,
            campaignName: campaign.campaignName,
            message: campaign.message,
            createdBy: campaign.createdBy?.companyName || 'Unknown',
            mobileNumberCount: campaign.mobileNumbers?.length || 0,
            createdAt: campaign.createdAt,
            image: campaign.media?.url || campaign.media || null,
            // User information for modal details
            userData: {
                companyName: campaign.createdBy?.companyName || 'Unknown',
                email: campaign.createdBy?.email || 'N/A',
                number: campaign.createdBy?.number || 'N/A',
                role: campaign.createdBy?.role || 'N/A',
                status: campaign.createdBy?.status || 'N/A',
                createdAt: campaign.createdBy?.createdAt || null,
            }
        }));

        return res.status(200).json({
            success: true,
            message: 'All campaigns fetched successfully.',
            data: {
                totalCampaigns: formattedCampaigns.length,
                campaigns: formattedCampaigns
            }
        });

    } catch (error: unknown) {
        console.error('Error in getAllCampaigns controller:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while fetching all campaigns.',
        });
    }
};

const support = async (req: Request, res: Response): Promise<Response> => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User not found.',
            });
        }

        const creator = await User.findById(user.userID).lean<UserDocument>();
        
        if (!creator) {
            return res.status(404).json({
                success: false,
                message: 'Creator not found.',
            });
        }

        const responseData: SupportResponse = {
            companyName: creator.companyName,
            email: creator.email,
            number: creator.number,
            role: creator.role,
            status: creator.status,
            image: creator.image
        };

        return res.status(200).json({
            success: true,
            message: 'User details fetched successfully.',
            data: responseData,
        });

    } catch (error: unknown) {
        console.error('Error in support controller:', error);
        
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }
        
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred in support controller.',
        });
    }
};

export { businessDetails, dashboard,
    transaction, news, complaints, 
    manageReseller, manageUser,
    treeView, whatsAppReports,
    allCampaigns, support
};