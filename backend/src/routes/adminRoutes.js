import { Router } from 'express';
import {
  listUsers,
  setRole,
  setActive,
  analytics,
} from '../controllers/adminController.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();

router.use(protect, allow('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/role', setRole);
router.patch('/users/:id/activate', setActive(true));
router.patch('/users/:id/deactivate', setActive(false));
router.get('/analytics', analytics);

export default router;
