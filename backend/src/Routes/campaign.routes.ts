import { Router } from 'express';
import createCampaign from '../Controllers/campaign.controller.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import upload, { multerErrorHandler } from '../Utils/upload.Utils.js';

const router = Router();

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign with optional file upload
 * @access  Private (add auth middleware later)
 * 
 * Form-data fields:
 * - campaignName (required)
 * - message (required)
 * - phoneButtonText (optional)
 * - phoneButtonNumber (optional)
 * - linkButtonText (optional)
 * - linkButtonUrl (optional)
 * - mobileNumberEntryType (required): "manual" or "upload"
 * - mobileNumbers (required): comma-separated string or array
 * - countryCode (required): e.g., "+91"
 * - file (optional): single image/video/PDF up to 5MB
 */

router.post('/',isLoggedIn, upload.single('file'), createCampaign, multerErrorHandler)

export default router;
