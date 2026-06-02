import { Router } from 'express';
import {
  startQuest,
  submitAttempt,
  myAttempts,
  reviewQueue,
  reviewAttempt,
} from '../controllers/attemptController.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', allow('learner'), startQuest);
router.get('/mine', allow('learner'), myAttempts);
router.patch('/:id/submit', allow('learner'), submitAttempt);

router.get('/review-queue', allow('mentor', 'admin'), reviewQueue);
router.patch('/:id/review', allow('mentor', 'admin'), reviewAttempt);

export default router;
