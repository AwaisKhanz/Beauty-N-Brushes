import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as userController from '../controllers/user.controller';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// User profile and settings routes
router.put('/profile', userController.updateProfile);
router.put('/notifications', userController.updateNotifications);
router.put('/password', userController.updatePassword);
router.put('/region', userController.updateRegion);
router.get('/payment-methods', userController.getPaymentMethods);
router.post('/payment-methods/setup-intent', userController.createSetupIntent);
router.post('/payment-methods/initialize-paystack', userController.initializePaystackPaymentMethod);
router.post('/payment-methods', userController.addPaymentMethod);

export default router;
