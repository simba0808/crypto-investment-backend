import express from 'express';
import {
  depositBalance,
  getRewards,
  getStarted,
  withdrawBalance
} from '../controllers/balanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/deposit', protect, depositBalance);
router.put('/withdraw', protect, withdrawBalance);
router.put('/rewards', protect, getRewards);
router.put('/start', protect, getStarted);

export default router;
