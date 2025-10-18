/**
 * Service-related constants
 * Re-exported from shared-constants for convenience
 */

// Re-export shared constants
export {
  SERVICE_SPECIALIZATIONS,
  SERVICE_CATEGORIES,
  BUSINESS_TYPES,
  DEPOSIT_TYPES,
  // Helper functions
  getEssentialCategories,
  getOptionalCategories,
  getCategoryById,
  getSubcategoryById,
  getServiceTemplate,
  getAllTemplatesForCategory,
} from '../../../shared-constants';

// Re-export types
export type {
  ServiceTemplate,
  ServiceSubcategory,
  ServiceCategory,
  ServiceSpecialization,
  ServiceCategoryId,
  BusinessType,
  DepositType,
} from '../../../shared-constants';
