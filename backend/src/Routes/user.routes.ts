
import express from 'express';
import upload from '../Utils/upload.Utils.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import { createUser, deleteUser, freezeUser, unfreezeUser } from '../Controllers/user.controller.js';
import checkUserStatus from '../Middlewares/checkUserStatus.middleware.js';
import hasAuthority from '../Middlewares/role.middleware.js';
import verifyUser from '../Middlewares/auth.Middleware.js';



const router = express.Router();


router.post('/create', isLoggedIn, hasAuthority, upload.single('image'), createUser);
router.delete('/delete/:userId', isLoggedIn, checkUserStatus, hasAuthority, upload.none(), deleteUser);
router.put('/freeze/:userId', isLoggedIn, checkUserStatus, hasAuthority, upload.none(), freezeUser);
router.put('/unfreeze/:userId', isLoggedIn, checkUserStatus, hasAuthority, upload.none(), unfreezeUser);



export default router;