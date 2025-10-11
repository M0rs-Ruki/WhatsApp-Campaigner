import express from 'express';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import businessDetails from '../Controllers/dashboard.Controller.js';



const router = express.Router();

router.get('/manage-business', isLoggedIn, businessDetails)

export default router;