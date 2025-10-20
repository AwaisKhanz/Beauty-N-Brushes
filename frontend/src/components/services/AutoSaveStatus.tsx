'use client';

import { formatDistanceToNow } from 'date-fns';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

interface AutoSaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}

export function AutoSaveStatus({ status, lastSaved }: AutoSaveStatusProps) {
  if (status === 'idle' && !lastSaved) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving draft...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-4 w-4 text-success" />
          <span className="text-success">Draft saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Failed to save</span>
        </>
      )}
      {status === 'idle' && lastSaved && (
        <>
          <Cloud className="h-4 w-4" />
          <span>Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
        </>
      )}
    </div>
  );
}
