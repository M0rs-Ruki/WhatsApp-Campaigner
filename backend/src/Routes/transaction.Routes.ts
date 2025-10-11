import express from 'express';
import upload from '../Utils/upload.Utils.js';
import isLoggedIn from '../Middlewares/isLoggedIn.Middleware.js';
import hasAuthority from '../Middlewares/role.middleware.js';
import {
  creditBalance,
  debitBalance,
} from '../Controllers/transaction.Controller.js';

const router = express.Router();

router.post('/credit', isLoggedIn, hasAuthority, upload.none(), creditBalance);
router.post('/debit', isLoggedIn, hasAuthority, upload.none(), debitBalance);

export default router;
