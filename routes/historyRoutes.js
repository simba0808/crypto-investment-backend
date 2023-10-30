import express from 'express';
import {
  depositHistory, withdrawHistory, showProgress, showBalance,
} from '../controllers/historyController.js';

const router = express.Router();

router.get('/deposit', depositHistory);
router.get('/withdraw', withdrawHistory);
router.get('/progress', showProgress);
router.get('/balance', showBalance);

export default router;
