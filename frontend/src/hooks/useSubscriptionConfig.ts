'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { SubscriptionConfigResponse } from '../../../shared-types';

/**
 * Hook to fetch and cache subscription configuration
 * Provides trial settings (enabled/disabled, duration)
 */
export function useSubscriptionConfig() {
  const [config, setConfig] = useState<SubscriptionConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.subscriptionConfig.get();
        setConfig(response.data.config);
      } catch (err) {
        console.error('Failed to fetch subscription config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trial configuration');
        // Set default fallback config
        setConfig({
          id: 'default',
          trialEnabled: true,
          trialDurationDays: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
}
