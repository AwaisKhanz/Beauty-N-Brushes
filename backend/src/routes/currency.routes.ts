import { Router } from 'express';
import {
  getExchangeRates,
  convertCurrency,
  refreshExchangeRates,
} from '../controllers/currency.controller';

const router = Router();

/**
 * @route   GET /api/currency/rates
 * @desc    Get current exchange rates
 * @access  Public
 */
router.get('/rates', getExchangeRates);

/**
 * @route   POST /api/currency/convert
 * @desc    Convert amount between currencies
 * @access  Public
 */
router.post('/convert', convertCurrency);

/**
 * @route   POST /api/currency/refresh
 * @desc    Force refresh exchange rates
 * @access  Public (can be restricted to admin later)
 */
router.post('/refresh', refreshExchangeRates);

export default router;
