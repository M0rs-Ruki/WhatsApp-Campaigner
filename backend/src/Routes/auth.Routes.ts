import express from 'express';
import { Registration, Login, Logout } from '../Controllers/auth.Controller.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import upload from '../Middlewares/upload.Middleware.js';

const router = express.Router();

router.post('/register', upload.single('image'), Registration);
router.post('/login', Login);

router.post('/logout', isLoggedIn, Logout);

export default router;
