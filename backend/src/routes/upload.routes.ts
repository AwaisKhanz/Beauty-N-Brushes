import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';

const router = Router();

// Single file upload (PUBLIC for visual search testing)
// Usage: POST /api/v1/upload?type=profile|logo|cover|service
router.post('/', upload.single('file'), uploadController.uploadFile);

// Multiple file upload (PUBLIC for visual search testing)
// Usage: POST /api/v1/upload/multiple?type=service
router.post('/multiple', upload.array('files', 10), uploadController.uploadMultipleFiles);

// Delete file (PROTECTED - requires authentication)
router.delete('/', authenticate, uploadController.deleteFile);

export default router;
