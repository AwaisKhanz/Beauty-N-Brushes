'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Bookmark, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

interface SaveSearchButtonProps {
  filters: {
    category?: string;
    subcategory?: string;
    city?: string;
    state?: string;
    radius?: number;
    priceMin?: number;
    priceMax?: number;
  };
}

export function SaveSearchButton({ filters }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [notifyNewMatches, setNotifyNewMatches] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    try {
      setSaving(true);
      setError('');

      await api.savedSearches.create({
        searchName: searchName.trim() || undefined,
        categoryId: filters.category,
        locationCity: filters.city,
        locationState: filters.state,
        maxDistanceMiles: filters.radius,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        notifyNewMatches,
      });

      toast.success('Search saved', {
        description: 'You can find it in your Saved Searches page',
      });

      setOpen(false);
      setSearchName('');
      setNotifyNewMatches(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to save search');
    } finally {
      setSaving(false);
    }
  }

  // Generate auto-name for search
  const autoGenerateName = (): string => {
    const parts: string[] = [];

    if (filters.category) parts.push('Services');
    if (filters.city && filters.state) parts.push(`in ${filters.city}, ${filters.state}`);
    else if (filters.city) parts.push(`in ${filters.city}`);
    else if (filters.state) parts.push(`in ${filters.state}`);
    if (filters.priceMin || filters.priceMax) {
      if (filters.priceMin && filters.priceMax) {
        parts.push(`$${filters.priceMin}-$${filters.priceMax}`);
      } else if (filters.priceMin) {
        parts.push(`from $${filters.priceMin}`);
      } else if (filters.priceMax) {
        parts.push(`up to $${filters.priceMax}`);
      }
    }

    return parts.join(' ') || 'My Search';
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setSearchName(autoGenerateName());
          setOpen(true);
        }}
        className="gap-2"
      >
        <Bookmark className="h-4 w-4" />
        Save Search
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save This Search</DialogTitle>
            <DialogDescription>
              Save your current search filters for quick access later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Name */}
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Hair stylists near downtown"
              />
              <p className="text-xs text-muted-foreground">Give your search a memorable name</p>
            </div>

            {/* Current Filters Summary */}
            <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
              <p className="font-medium">Current Filters:</p>
              {filters.category && (
                <p className="text-muted-foreground">• Category: {filters.category}</p>
              )}
              {(filters.city || filters.state) && (
                <p className="text-muted-foreground">
                  • Location: {filters.city}
                  {filters.city && filters.state && ', '}
                  {filters.state}
                </p>
              )}
              {filters.radius && (
                <p className="text-muted-foreground">• Radius: {filters.radius} miles</p>
              )}
              {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
                <p className="text-muted-foreground">
                  • Price: ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
                </p>
              )}
            </div>

            {/* Notifications */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify"
                checked={notifyNewMatches}
                onCheckedChange={(checked) => setNotifyNewMatches(checked as boolean)}
              />
              <Label htmlFor="notify" className="cursor-pointer text-sm">
                Notify me when new matching services are added
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Search'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
