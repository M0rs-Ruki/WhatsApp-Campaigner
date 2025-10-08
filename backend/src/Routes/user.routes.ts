
import express from 'express';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import upload from '../Utils/upload.Utils.js';


const router = express.Router();

router.post('/create', isLoggedIn, upload.single('image'), )


export default router;