import express from 'express';
import { createNews, updateNews, deleteNews } from '../Controllers/news.Controller.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import isAdmin from '../Middlewares/isAdmin.Middleware.js';
import upload from '../Utils/upload.Utils.js';



const router = express.Router();

router.post('/create', isLoggedIn, isAdmin, upload.none(), createNews);
router.put('/update/:newsId', isLoggedIn, isAdmin, upload.none(), updateNews);
router.delete('/delete/:newsId', isLoggedIn, isAdmin, upload.none(), deleteNews);

export default router;