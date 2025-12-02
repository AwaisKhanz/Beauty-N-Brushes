import { AppError } from '../middleware/errorHandler';

/**
 * Provider Context Type
 * Represents the type of provider access (owner or team member)
 */
export type ProviderContextType = 'owner' | 'team_member';

/**
 * Provider Context Interface
 * Contains all information needed for provider dashboard access
 */
export interface ProviderContext {
  type: ProviderContextType;
  profile: any; // ProviderProfile with relations
  teamMember?: {
    teamMemberId: string;
    providerId: string;
    providerName: string;
    providerSlug: string;
    role: string | null;
    displayName: string;
    isTeamMember: true;
    canManageBookings: boolean;
    canManageServices: boolean;
  };
  isOwner: boolean;
  isTeamMember: boolean;
  canManageTeam: boolean;
  canManageFinances: boolean;
  canManageSettings: boolean;
}

/**
 * Permission Helper Functions
 * Reusable permission checks for provider features
 */
export class PermissionHelper {
  /**
   * Check if user can manage team members
   */
  static canManageTeam(context: ProviderContext): boolean {
    return context.isOwner;
  }

  /**
   * Check if user can manage finances
   */
  static canManageFinances(context: ProviderContext): boolean {
    return context.isOwner;
  }

  /**
   * Check if user can manage settings
   */
  static canManageSettings(context: ProviderContext): boolean {
    return context.isOwner;
  }

  /**
   * Check if user can manage bookings
   */
  static canManageBookings(context: ProviderContext): boolean {
    if (context.isOwner) return true;
    if (context.teamMember) return context.teamMember.canManageBookings;
    return false;
  }

  /**
   * Check if user can manage services
   */
  static canManageServices(context: ProviderContext): boolean {
    if (context.isOwner) return true;
    if (context.teamMember) return context.teamMember.canManageServices;
    return false;
  }

  /**
   * Require owner permission
   * Throws error if user is not owner
   */
  static requireOwner(context: ProviderContext): void {
    if (!context.isOwner) {
      throw new AppError(403, 'This action requires salon owner permissions');
    }
  }

  /**
   * Require specific permission
   * Throws error if user doesn't have permission
   */
  static requirePermission(
    context: ProviderContext,
    permission: 'team' | 'finances' | 'settings' | 'bookings' | 'services'
  ): void {
    switch (permission) {
      case 'team':
        if (!this.canManageTeam(context)) {
          throw new AppError(403, 'No permission to manage team members');
        }
        break;
      case 'finances':
        if (!this.canManageFinances(context)) {
          throw new AppError(403, 'No permission to manage finances');
        }
        break;
      case 'settings':
        if (!this.canManageSettings(context)) {
          throw new AppError(403, 'No permission to manage settings');
        }
        break;
      case 'bookings':
        if (!this.canManageBookings(context)) {
          throw new AppError(403, 'No permission to manage bookings');
        }
        break;
      case 'services':
        if (!this.canManageServices(context)) {
          throw new AppError(403, 'No permission to manage services');
        }
        break;
    }
  }

  /**
   * Get provider ID from context
   * Works for both owners and team members
   */
  static getProviderId(context: ProviderContext): string {
    return context.profile.id;
  }

  /**
   * Get display name for header
   * Returns salon name for both owners and team members
   */
  static getDisplayName(context: ProviderContext): string {
    return context.profile.businessName || 'Provider';
  }

  /**
   * Get role badge text
   * Returns role for team members, null for owners
   */
  static getRoleBadge(context: ProviderContext): string | null {
    if (context.isTeamMember && context.teamMember) {
      return context.teamMember.role || 'Team Member';
    }
    return null;
  }
}
