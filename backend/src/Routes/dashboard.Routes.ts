import express from 'express';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import { businessDetails, dashboard, transaction, news, complaints, manageReseller } from '../Controllers/dashboard.Controller.js';



const router = express.Router();

router.get('/manage-business', isLoggedIn, businessDetails);
router.get('/home', isLoggedIn, dashboard);
router.get('/transaction', isLoggedIn, transaction);
router.get('/news', isLoggedIn, news);
router.get('/complaints', isLoggedIn, complaints);
router.get('/manage-reseller', isLoggedIn, manageReseller);

export default router;