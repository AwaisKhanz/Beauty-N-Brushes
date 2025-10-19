import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as draftController from '../controllers/serviceDraft.controller';

const router = Router();

router.use(authenticate);

router.post('/', draftController.saveDraft);
router.get('/', draftController.getDraft);
router.delete('/', draftController.deleteDraft);

export default router;
