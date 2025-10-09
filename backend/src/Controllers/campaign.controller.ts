
import { Request, Response, NextFunction } from 'express';
import Campaign, { ICampaign, MediaType, MobileNumberEntryType } from '../Models/Campaign.model.js';
import { getFileTypeCategory } from '../Utils/upload.Utils.js'; 

interface CreateCampaignBody {
    campaignName: string;
    message: string;
    phoneButtonText?: string;
    phoneButtonNumber?: string;
    linkButtonText?: string;
    linkButtonUrl?: string;
    mobileNumberEntryType: MobileNumberEntryType;
    mobileNumbers: string | string[]; // Can be comma-separated string or array
    countryCode: string;
}


/**
 * @desc    Create a new campaign
 * @route   POST /api/campaigns
 * @access  Private (add auth middleware later)
 */

const createCampaign = async (
    req: Request<unknown, unknown, CreateCampaignBody>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {
            campaignName,
            message,
            phoneButtonText,
            phoneButtonNumber,
            linkButtonText,
            linkButtonUrl,
            mobileNumberEntryType,
            mobileNumbers,
            countryCode
        } = req.body;

        if (!campaignName || !message || !countryCode) {
            res.status(400).json({
                success: false,
                message: 'Campaign name, message, and country code are required fields are required.'
            });
            return;
        }

        let numbersArray: string[] = [];
        if (typeof mobileNumbers === 'string') {
            numbersArray = mobileNumbers.split(',').map(num => num.trim()).filter(num => num.length > 0);
        } else if (Array.isArray(mobileNumbers)) {
            numbersArray = mobileNumbers;
        }

        if (numbersArray.length === 0) {
            res.status(400).json({
                success: false,
                message: 'At least one mobile number is required.'
            });
            return;
        }

        const campaignData: Partial<ICampaign> = {
            campaignName,
            message,
            mobileNumberEntryType,
            mobileNumbers: numbersArray,
            countryCode
        };

        if (phoneButtonText && phoneButtonNumber) {
            campaignData.phoneButton = {
                text: phoneButtonText,
                number: phoneButtonNumber
            };
        }

        if (linkButtonText && linkButtonUrl) {
            campaignData.linkButton = {
                text: linkButtonText,
                url: linkButtonUrl
            };
        }

        if (req.file) {
            const file = req.file;

            const maxSize = 5* 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                res.status(400).json({
                    success: false,
                    message: 'File size exceeds the allowed limit of 5MB.'
                });
                return;
            }

            const fileCategory = getFileTypeCategory(file.mimetype);
            if (!fileCategory) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only images, videos, and PDFs are allowed.'
                });
            }
        }

        // Create campaign in database
        const newCampaign = await Campaign.create(campaignData);

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Campaign created successfully',
            data: {
                campaignId: newCampaign._id,
                campaignName: newCampaign.campaignName,
                message: newCampaign.message,
                phoneButton: newCampaign.phoneButton,
                linkButton: newCampaign.linkButton,
                media: newCampaign.media,
                mobileNumberEntryType: newCampaign.mobileNumberEntryType,
                numberCount: newCampaign.numberCount,
                countryCode: newCampaign.countryCode,
                createdAt: newCampaign.createdAt
            }
        });

    } catch (error: any) {
        console.error('Error creating campaign:', error);
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
            return;
        }

        // Handle other errors
        res.status(500).json({
            success: false,
            message: 'Server error while creating campaign',
            error: error.message
        });
    }
};

export default createCampaign;