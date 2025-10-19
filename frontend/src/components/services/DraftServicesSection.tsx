'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import { DraftServiceCard } from './DraftServiceCard';
import type { DraftService } from '../../../shared-types';

interface DraftServicesSectionProps {
  className?: string;
}

export function DraftServicesSection({ className }: DraftServicesSectionProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await api.services.getDrafts();
      setDrafts(response.data.drafts);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error) || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDrafts();
      toast.success('Drafts refreshed');
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error) || 'Failed to refresh drafts');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
  };

  const handleCreateNew = () => {
    router.push('/provider/services/create');
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Draft Services
            {drafts.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {drafts.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleCreateNew} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Service
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {drafts.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Services</h3>
            <p className="text-gray-500 mb-4">
              Start creating a new service and it will be saved as a draft automatically.
            </p>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Service
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <DraftServiceCard key={draft.id} draft={draft} onDelete={handleDeleteDraft} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
