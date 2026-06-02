import { Router } from 'express';
import {
  getMe,
  updateMe,
  changePassword,
  deleteMe,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/me', protect, getMe);
router.patch('/me', protect, upload.single('profilePic'), updateMe);
router.patch('/me/password', protect, changePassword);
router.delete('/me', protect, deleteMe);

export default router;
