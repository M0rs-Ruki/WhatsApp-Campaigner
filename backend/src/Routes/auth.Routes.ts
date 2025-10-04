import express from 'express';
import { register, login, logout, getProfile } from '../Controllers/auth.Controller.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.post('/logout', isLoggedIn, logout);
router.get('/profile', isLoggedIn, getProfile);

export default router;
