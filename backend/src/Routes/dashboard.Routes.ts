import express from 'express';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import { businessDetails, dashboard } from '../Controllers/dashboard.Controller.js';



const router = express.Router();

router.get('/manage-business', isLoggedIn, businessDetails)
router.get('/home', isLoggedIn, dashboard)

export default router;