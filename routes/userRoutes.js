import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  // getUserProfile,
  mailHandler,
  remailHandler,
  updateUserProfile,
  checkAuth,
  upState,
  changePassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', checkAuth);
router.post('/register', registerUser);
router.post('/password', changePassword);
router.post('/mail', mailHandler);
router.post('/remail', remailHandler);
router.post('/auth', authUser);
router.post('/cycle', upState);
router.post('/logout', logoutUser);
// router.put('/profile', protect ,updateUserProfile);
router
  .route('/profile')
  .put(protect, updateUserProfile);

export default router;
