import express from 'express';
import { Registration, Login, Logout } from '../Controllers/auth.Controller.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';

const router = express.Router();

// Public routes
router.post('/register', Registration);
router.post('/login', Login);

// Protected routes (require authentication)
router.post('/logout', isLoggedIn, Logout);

export default router;
