'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, FileText } from 'lucide-react';

interface DraftRecoveryDialogProps {
  open: boolean;
  draftTimestamp: string;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRecoveryDialog({
  open,
  draftTimestamp,
  onRestore,
  onDiscard,
}: DraftRecoveryDialogProps) {
  const timeAgo = formatDistanceToNow(new Date(draftTimestamp), { addSuffix: true });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Resume Your Service Draft?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>We found an unsaved draft from your previous session.</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last saved {timeAgo}</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Start Fresh</AlertDialogCancel>
          <AlertDialogAction onClick={onRestore} className="bg-primary">
            Resume Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
