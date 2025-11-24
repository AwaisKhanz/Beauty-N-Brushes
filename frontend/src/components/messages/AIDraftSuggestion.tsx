'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Edit, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/error-utils';

interface AIDraftSuggestionProps {
  conversationId: string;
  lastClientMessage: string;
  onAcceptDraft: (draftText: string) => void;
  onDismiss: () => void;
}

export function AIDraftSuggestion({
  conversationId,
  lastClientMessage,
  onAcceptDraft,
  onDismiss,
}: AIDraftSuggestionProps) {
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [showDraft, setShowDraft] = useState(false);

  async function generateDraft() {
    try {
      setGenerating(true);
      const response = await api.messages.generateDraft({
        conversationId,
        clientMessage: lastClientMessage,
      });

      setDraft(response.data.draft);
      setConfidence(response.data.confidence);
      setShowDraft(true);
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to generate draft';
      toast.error('AI Draft Failed', {
        description: message,
      });
    } finally {
      setGenerating(false);
    }
  }

  function handleAccept() {
    onAcceptDraft(draft);
    setShowDraft(false);
    setDraft('');
  }

  function handleEdit() {
    onAcceptDraft(draft);
    setShowDraft(false);
    setDraft('');
  }

  if (!showDraft) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={generateDraft}
        disabled={generating}
        className="gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate AI Reply
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">AI Suggested Reply</h4>
            <Badge variant="secondary" className="text-xs">
              {Math.round(confidence * 100)}% confidence
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowDraft(false);
              onDismiss();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-background p-3 rounded-lg border">
          <p className="text-sm whitespace-pre-wrap">{draft}</p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleAccept} className="gap-2 flex-1">
            <Send className="h-4 w-4" />
            Send as is
          </Button>
          <Button size="sm" variant="outline" onClick={handleEdit} className="gap-2 flex-1">
            <Edit className="h-4 w-4" />
            Edit & Send
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          AI drafts are based on your policies, availability, and communication style. Always review
          before sending.
        </p>
      </CardContent>
    </Card>
  );
}
