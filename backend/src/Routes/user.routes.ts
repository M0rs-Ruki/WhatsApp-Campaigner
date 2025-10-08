
import express from 'express';
import upload from '../Utils/upload.Utils.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import { createUser, deleteUser, freezeUser, unfreezeUser } from '../Controllers/user.controller.js';
import checkUserStatus from '../Middlewares/checkUserStatus.middleware.js';
import hasAuthority from '../Middlewares/role.middleware.js';



const router = express.Router();

router.post('/create', isLoggedIn, hasAuthority, upload.single('image'), createUser);
router.delete('/delete/:userId', hasAuthority, upload.none(), isLoggedIn, checkUserStatus, deleteUser);
router.put('/freeze/:userId', hasAuthority, upload.none(), isLoggedIn, checkUserStatus, freezeUser);
router.put('/unfreeze/:userId', hasAuthority, upload.none(), isLoggedIn, checkUserStatus, unfreezeUser);



export default router;