import { Router } from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/user.controller.js';

const router = Router();

router.get('/settings', getUserSettings);
router.put('/settings', updateUserSettings);

export default router;
