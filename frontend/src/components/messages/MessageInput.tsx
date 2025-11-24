'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MessageInputProps {
  onSend: (content: string, attachmentUrls?: string[]) => Promise<void>;
  initialText?: string;
}

export function MessageInput({ onSend, initialText }: MessageInputProps) {
  const [content, setContent] = useState(initialText || '');
  const [sending, setSending] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Update content when initialText changes (from AI draft)
  useEffect(() => {
    if (initialText) {
      setContent(initialText);
    }
  }, [initialText]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    if (files.length + attachmentFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Validate file sizes (5MB max)
    const invalidFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast.error('Each image must be under 5MB');
      return;
    }

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setAttachmentFiles((prev) => [...prev, ...files]);
  }

  function removeAttachment(index: number) {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if (!content.trim() && attachmentFiles.length === 0) {
      return;
    }

    try {
      setSending(true);

      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachmentFiles.length > 0) {
        setUploading(true);
        const uploadRes = await api.upload.multiple(attachmentFiles, 'message');
        if (uploadRes.success && uploadRes.data) {
          attachmentUrls = uploadRes.data.files.map((f) => f.url);
        }
        setUploading(false);
      }

      // Send message
      await onSend(content.trim(), attachmentUrls.length > 0 ? attachmentUrls : undefined);

      // Clear input
      setContent('');
      setAttachmentFiles([]);
      setAttachmentPreviews([]);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="space-y-3">
      {/* Attachment Previews */}
      {attachmentPreviews.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachmentPreviews.map((preview, index) => (
            <div key={index} className="relative w-20 h-20">
              <Image
                src={preview}
                alt={`Attachment ${index + 1}`}
                fill
                className="object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 z-10"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        {/* Image Upload */}
        <div>
          <input
            type="file"
            id="message-attachment"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="sr-only"
            disabled={sending || uploading}
          />
          <label htmlFor="message-attachment">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={sending || uploading || attachmentFiles.length >= 5}
              asChild
            >
              <span className="cursor-pointer">
                <ImageIcon className="h-4 w-4" />
              </span>
            </Button>
          </label>
        </div>

        {/* Text Input */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          className="resize-none min-h-[40px] max-h-32"
          disabled={sending || uploading}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={sending || uploading || (!content.trim() && attachmentFiles.length === 0)}
          size="icon"
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
    </div>
  );
}
