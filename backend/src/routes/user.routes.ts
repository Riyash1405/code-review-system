import { Router } from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { updateSettingsSchema } from '../schemas/user.schema.js';

const router = Router();

router.get('/settings', getUserSettings);
router.put('/settings', validate(updateSettingsSchema), updateUserSettings);

export default router;
