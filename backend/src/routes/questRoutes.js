import { Router } from 'express';
import {
  listQuests,
  getMeta,
  getQuest,
  createQuest,
  updateQuest,
  setPublished,
  deleteQuest,
} from '../controllers/questController.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', listQuests);
router.get('/meta', getMeta);
router.get('/:id', getQuest);

router.post('/', allow('mentor', 'admin'), createQuest);
router.patch('/:id', allow('mentor', 'admin'), updateQuest);
router.patch('/:id/publish', allow('mentor', 'admin'), setPublished(true));
router.patch('/:id/unpublish', allow('mentor', 'admin'), setPublished(false));
router.delete('/:id', allow('mentor', 'admin'), deleteQuest);

export default router;
