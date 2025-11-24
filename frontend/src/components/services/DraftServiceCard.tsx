'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, Clock, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import type { DraftService } from '@/shared-types/service.types';

interface DraftServiceCardProps {
  draft: DraftService;
  onDelete?: (draftId: string) => void;
}

const STEP_NAMES = [
  'Basic Information',
  'AI Description',
  'Pricing & Duration',
  'Photos & Videos',
  'Add-ons & Variations',
  'Review & Publish',
];

export function DraftServiceCard({ draft, onDelete }: DraftServiceCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleContinueEditing = () => {
    // Navigate to service creation with draft ID
    router.push(`/provider/services/create?draft=${draft.id}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.serviceDrafts.delete();
      onDelete?.(draft.id);
      toast.success('Draft deleted successfully');
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error) || 'Failed to delete draft');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStepIcon = (step: number) => {
    const icons = [
      <FileText key="step-0" className="h-4 w-4" />,
      <CheckCircle2 key="step-1" className="h-4 w-4" />,
      <Clock key="step-2" className="h-4 w-4" />,
      <Edit3 key="step-3" className="h-4 w-4" />,
      <AlertCircle key="step-4" className="h-4 w-4" />,
      <CheckCircle2 key="step-5" className="h-4 w-4" />,
    ];
    return icons[step] || <FileText key="step-default" className="h-4 w-4" />;
  };

  const formatLastSaved = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-warning/30 bg-warning/5 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              {getStepIcon(draft.currentStep)}
              {draft.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="warning">Draft</Badge>
              <span className="text-sm text-muted-foreground">
                {draft.category}
                {draft.subcategory && ` • ${draft.subcategory}`}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {draft.currentStep + 1} of {STEP_NAMES.length}
            </span>
            <span className="text-muted-foreground">{formatLastSaved(draft.lastSaved)}</span>
          </div>

          <div className="text-sm text-foreground/90">
            <strong>{STEP_NAMES[draft.currentStep]}</strong>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleContinueEditing}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Continue Editing
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Draft</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this draft? This action cannot be undone. You
                    will lose all progress on "{draft.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Draft'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
