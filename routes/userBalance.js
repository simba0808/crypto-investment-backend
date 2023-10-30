import express from 'express';
import {
  depositBalance,
  getRewards,
  getStarted,
  withdrawBalance,
  approveBalance,
} from '../controllers/balanceController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/deposit', protect, depositBalance);
router.put('/withdraw', protect, withdrawBalance);
router.put('/rewards', protect, getRewards);
router.put('/start', protect, getStarted);
router.put('/approve', adminProtect, approveBalance);

export default router;
