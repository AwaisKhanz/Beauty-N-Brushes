/**
 * Shared Constants Index
 * Re-export all shared constants for easy importing
 */

// Subscription
export {
  REGIONS,
  REGIONS_ARRAY,
  PAYSTACK_COUNTRIES,
  EXCHANGE_RATES,
  getPaymentInfoFromCountry,
  type RegionCode,
  type PaymentProvider,
  type Currency,
} from './region.constants';

export {
  convertCurrency,
  convertToSubunit,
  convertFromSubunit,
  getCurrencySymbol,
  formatCurrency,
  convertUSDToRegional,
} from './currency.utils';

export { REGIONAL_SERVICE_FEES } from './service-fee.constants';
export { SUBSCRIPTION_TIERS, TRIAL_PERIOD_DAYS } from './subscription.constants';
export { calculatePlatformFee } from './platform-fee.constants';

// Service Constants
export {
  BUSINESS_TYPES,
  SERVICE_SPECIALIZATIONS,
  SERVICE_CATEGORIES,
  DEPOSIT_TYPES,
  getEssentialCategories,
  getOptionalCategories,
  getCategoryById,
  getSubcategoryById,
  getServiceTemplate,
  getAllTemplatesForCategory,
  type BusinessType,
  type ServiceSpecialization,
  type ServiceCategoryId,
  type DepositType,
  type ServiceTemplate,
  type ServiceCategory,
  type ServiceSubcategory,
} from './service.constants';

// Validation
export * from './validation.constants';

// API Endpoints
export * from './api-endpoints.constants';
