import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as locationController from '../controllers/location.controller';

const router = Router();

// All location routes require authentication
router.use(authenticate);

// Location management routes
router.get('/', locationController.getLocations);
router.post('/', locationController.createLocation);
router.get('/:locationId', locationController.getLocation);
router.put('/:locationId', locationController.updateLocation);
router.delete('/:locationId', locationController.deleteLocation);

export default router;

