import { useCallback, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { api } from '@/lib/api';
import type { ServiceWizardData } from '@/components/services/ServiceCreationWizard';

const LOCALSTORAGE_KEY = 'service-draft-backup';

export function useServiceDraftAutoSave(
  form: UseFormReturn<ServiceWizardData>,
  currentStep: number,
  isEdit: boolean
) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Save to localStorage (instant backup)
  const saveToLocalStorage = useCallback((data: Partial<ServiceWizardData>, step: number) => {
    try {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({
          draftData: data,
          currentStep: step,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // Save to server
  const saveToServer = useCallback(
    async (data: Partial<ServiceWizardData>, step: number) => {
      if (isEdit) return; // Don't save drafts when editing existing services

      try {
        setSaveStatus('saving');
        await api.serviceDrafts.save({
          draftData: data,
          currentStep: step,
        });
        setSaveStatus('saved');
        setLastSaved(new Date());

        // Clear status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save draft to server:', error);
        setSaveStatus('error');
      }
    },
    [isEdit]
  );

  // Main auto-save function (called after each step)
  const autoSave = useCallback(async () => {
    const formData = form.getValues();

    // Save to localStorage immediately
    saveToLocalStorage(formData, currentStep);

    // Save to server
    await saveToServer(formData, currentStep);
  }, [form, currentStep, saveToLocalStorage, saveToServer]);

  // Load draft from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }, []);

  // Load draft from server
  const loadFromServer = useCallback(async () => {
    try {
      const response = await api.serviceDrafts.get();
      return response.data.draft;
    } catch (error) {
      console.error('Failed to load draft from server:', error);
      return null;
    }
  }, []);

  // Clear all drafts
  const clearDraft = useCallback(async () => {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    try {
      await api.serviceDrafts.delete();
    } catch (error) {
      console.error('Failed to delete server draft:', error);
    }
  }, []);

  return {
    autoSave,
    saveStatus,
    lastSaved,
    loadFromLocalStorage,
    loadFromServer,
    clearDraft,
  };
}
