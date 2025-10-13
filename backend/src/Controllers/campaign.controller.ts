import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Campaign, { ICampaign, MobileNumberEntryType } from '../Models/Campaign.model.js';
import User from '../Models/user.Model.js';
import { getFileTypeCategory } from '../Utils/upload.Utils.js';
import { MediaType as CampaignMediaType } from '../Models/Campaign.model.js';
// import { debitForCampaignService } from '../Utils/transaction.Utlis.js';

interface CreateCampaignBody {
    campaignName: string;
    message: string;
    phoneButtonText?: string;
    phoneButtonNumber?: string;
    linkButtonText?: string;
    linkButtonUrl?: string;
    mobileNumberEntryType: MobileNumberEntryType;
    mobileNumbers: string | string[];
    countryCode: string;
}

const createCampaign = async (
    req: Request<unknown, unknown, CreateCampaignBody>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
            return;
        }

        const creatorId = req.user._id;
        const creatorRole = req.user.role; // Get user's role

        const {
            campaignName,
            message,
            phoneButtonText,
            phoneButtonNumber,
            linkButtonText,
            linkButtonUrl,
            mobileNumberEntryType,
            mobileNumbers,
            countryCode,
        } = req.body;

        if (!campaignName || !message || !countryCode) {
            res.status(400).json({
                success: false,
                message: 'Campaign name, message, and country code are required.',
            });
            return;
        }

        // Parse mobile numbers
        let numbersArray: string[] = [];
        if (typeof mobileNumbers === 'string') {
            numbersArray = mobileNumbers
                .split(',')
                .map(num => num.trim())
                .filter(num => num.length > 0);
        } else if (Array.isArray(mobileNumbers)) {
            numbersArray = mobileNumbers;
        }

        if (numbersArray.length === 0) {
            res.status(400).json({
                success: false,
                message: 'At least one mobile number is required.',
            });
            return;
        }

        const requestedNumberCount = numbersArray.length;

        // Check user balance
        const user = await User.findById(creatorId).session(session);
        if (!user) {
            await session.abortTransaction();
            res.status(404).json({
                success: false,
                message: 'User not found.',
            });
            return;
        }

        // ✅ FIXED: Admin has unlimited balance, others need to check
        let actualNumberCount: number;
        
        if (user.role === 'admin') {
            // Admin can create campaigns with any number of contacts
            actualNumberCount = requestedNumberCount;
        } else {
            // Reseller/User: Limit numbers based on balance (1 point = 1 number)
            actualNumberCount = Math.min(requestedNumberCount, user.balance);
            
            if (actualNumberCount === 0) {
                await session.abortTransaction();
                res.status(400).json({
                    success: false,
                    message: 'Insufficient balance. You need at least 1 point to create a campaign.',
                });
                return;
            }
        }

        // Slice the numbers array to match allowed count
        const processedNumbers = numbersArray.slice(0, actualNumberCount);

        // Build campaign data
        const campaignData: Partial<ICampaign> = {
            campaignName,
            message,
            mobileNumberEntryType,
            mobileNumbers: processedNumbers,
            countryCode,
            createdBy: creatorId,
        };

        if (phoneButtonText && phoneButtonNumber) {
            campaignData.phoneButton = {
                text: phoneButtonText,
                number: phoneButtonNumber,
            };
        }

        if (linkButtonText && linkButtonUrl) {
            campaignData.linkButton = {
                text: linkButtonText,
                url: linkButtonUrl,
            };
        }

        // File validation
        if (req.file) {
            const file = req.file;
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                await session.abortTransaction();
                res.status(400).json({
                    success: false,
                    message: 'File size exceeds the allowed limit of 5MB.',
                });
                return;
            }

            const fileCategory = getFileTypeCategory(file.mimetype);
            if (!fileCategory) {
                await session.abortTransaction();
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only images, videos, and PDFs are allowed.',
                });
                return;
            }

            campaignData.media = {
                type: fileCategory as unknown as CampaignMediaType,
                url: file.path,
                filename: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
            };
        }

        // Create campaign within session
        const newCampaignArray = await Campaign.create([campaignData], { session });
        const newCampaign = newCampaignArray[0];

        // ✅ FIXED: Only deduct balance if NOT admin
        const balanceBefore = user.balance;
        let balanceAfter = user.balance;

        if (user.role !== 'admin') {
            // Deduct balance for reseller/user
            user.balance -= actualNumberCount;
            balanceAfter = user.balance;
        }
        // Admin's balance stays the same (infinite money)

        // Create transaction
        const Transaction = mongoose.model('Transaction');
        const transactionDoc = await Transaction.create([{
            receiverId: user._id,
            campaignId: newCampaign._id,
            type: "debit",
            amount: actualNumberCount,
            balanceBefore,
            balanceAfter,
            status: "success"
        }], { session });

        const transaction = transactionDoc[0];

        // Update user: add campaign, increment totalCampaigns, add transaction
        user.allCampaign.push(newCampaign._id as unknown as mongoose.Types.ObjectId);
        user.totalCampaigns += 1;
        user.allTransaction.push(transaction._id);

        await user.save({ session });

        // Commit transaction
        await session.commitTransaction();

        // Success response
        res.status(201).json({
            success: true,
            message: actualNumberCount < requestedNumberCount 
                ? `Campaign created with ${actualNumberCount} numbers (limited by balance). ${requestedNumberCount - actualNumberCount} numbers were excluded.`
                : 'Campaign created successfully.',
            data: {
                campaignId: newCampaign._id,
                campaignName: newCampaign.campaignName,
                message: newCampaign.message,
                phoneButton: newCampaign.phoneButton,
                linkButton: newCampaign.linkButton,
                media: newCampaign.media,
                mobileNumberEntryType: newCampaign.mobileNumberEntryType,
                requestedNumberCount,
                actualNumberCount,
                pointsDeducted: user.role === 'admin' ? 0 : actualNumberCount,
                remainingBalance: balanceAfter,
                countryCode: newCampaign.countryCode,
                createdAt: newCampaign.createdAt,
                transactionId: transaction._id,
            },
        });
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error creating campaign:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages,
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating campaign',
            error: error.message,
        });
    } finally {
        await session.endSession();
    }
};

export default createCampaign;
