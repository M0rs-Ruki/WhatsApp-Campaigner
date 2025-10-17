import express from 'express';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import { businessDetails,
    dashboard, transaction, news, complaints,
    manageReseller, manageUser, treeView, whatsAppReports, allCampaigns } from '../Controllers/dashboard.Controller.js';
import { exportCampaignToExcel } from '../Controllers/export.Controller.js';

const router = express.Router();

router.get('/manage-business', isLoggedIn, businessDetails);
router.get('/home', isLoggedIn, dashboard);
router.get('/transaction', isLoggedIn, transaction);
router.get('/news', isLoggedIn, news);
router.get('/complaints', isLoggedIn, complaints);
router.get('/manage-reseller', isLoggedIn, manageReseller);
router.get('/manage-user', isLoggedIn, manageUser);
router.get('/tree-view', isLoggedIn, treeView);
router.get('/whatsapp-reports', isLoggedIn, whatsAppReports);
router.get('/export-campaign/:campaignId', isLoggedIn, exportCampaignToExcel);
router.get('/all-campaigns', isLoggedIn, allCampaigns);

export default router;