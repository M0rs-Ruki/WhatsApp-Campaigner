import { Router } from 'express';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import upload, { multerErrorHandler } from '../Utils/upload.Utils.js';
import { createComplaint, deleteComplaint, updateComplaint } from '../Controllers/complaint.Controller.js';

const router = Router();

router.post('/create', isLoggedIn, upload.none(), createComplaint, multerErrorHandler);
router.delete('/delete/:complaintId', isLoggedIn, deleteComplaint, multerErrorHandler);
router.put('/update/:complaintId', isLoggedIn, upload.none(), updateComplaint, multerErrorHandler);

export default router;

