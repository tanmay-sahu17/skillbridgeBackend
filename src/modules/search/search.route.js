import express from 'express';
import { syncAllToElasticsearch, searchEntities } from './search.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public or Protected depending on use case. For now, protected.
router.use(protect);

router.get('/', searchEntities);

// Only admins should be able to trigger bulk sync
router.post('/sync-all', authorize('ADMIN'), syncAllToElasticsearch);

export default router;
