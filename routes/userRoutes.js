import express from 'express';
import {
  authUser,
  registerUser,
  logoutUser,
  allUsers,
  mailHandler,
  remailHandler,
  updateUserProfile,
  updateAdminUserProfile,
  checkAuth,
  upState,
  changePassword,
  getDashboardInfo,
  deleteUser,
  findUser,
  uploadAvatar,
  getAvatar,
} from '../controllers/userController.js';

import upload from '../middleware/gridMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminProtect } from '../middleware/authMiddleware.js';
import { getPayAuthToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', checkAuth);
router.post('/register', getPayAuthToken, registerUser);
router.post('/password', changePassword);
router.post('/mail', mailHandler);
router.post('/remail', remailHandler);
router.post('/auth', authUser);
router.post('/cycle', upState);
router.post('/logout', logoutUser);
router.get('/allusers', adminProtect, allUsers);
router.get('/dashboard', adminProtect, getDashboardInfo);
router.delete('/delete/:id', deleteUser),
router.post('/find', findUser),
router.post('/force', updateAdminUserProfile),
router.post('/upload', upload.single('file') ,uploadAvatar);
router.get('/avatar/:filename', getAvatar);

// router.put('/profile', protect ,updateUserProfile);
router
  .route('/profile')
  .put(protect, updateUserProfile);

export default router;
