'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Link from 'next/link';
import {
  Bookmark,
  MapPin,
  DollarSign,
  AlertCircle,
  Search,
  Trash2,
  Edit,
  Play,
  Bell,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { SavedSearch } from '@/shared-types/savedSearch.types';
import { toast } from 'sonner';

export default function SavedSearchesPage() {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotify, setEditNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  async function fetchSavedSearches() {
    try {
      setLoading(true);
      setError('');
      const res = await api.savedSearches.getAll();
      setSavedSearches(res.data.savedSearches);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(searchId: string) {
    try {
      setDeletingId(searchId);
      await api.savedSearches.delete(searchId);

      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
      toast.success('Saved search deleted');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to delete saved search');
    } finally {
      setDeletingId(null);
    }
  }

  function handleEditClick(search: SavedSearch) {
    setEditingSearch(search);
    setEditName(search.searchName || '');
    setEditNotify(search.notifyNewMatches);
    setEditDialogOpen(true);
  }

  async function handleEditSave() {
    if (!editingSearch) return;

    try {
      setSaving(true);
      await api.savedSearches.update(editingSearch.id, {
        searchName: editName || undefined,
        notifyNewMatches: editNotify,
      });

      // Update local state
      setSavedSearches((prev) =>
        prev.map((s) =>
          s.id === editingSearch.id
            ? { ...s, searchName: editName || null, notifyNewMatches: editNotify }
            : s
        )
      );

      toast.success('Saved search updated');
      setEditDialogOpen(false);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to update saved search');
    } finally {
      setSaving(false);
    }
  }

  function handleRunSearch(search: SavedSearch) {
    // Build search URL with parameters
    const params = new URLSearchParams();

    if (search.categoryId) params.append('category', search.categoryId);
    if (search.locationCity) params.append('city', search.locationCity);
    if (search.locationState) params.append('state', search.locationState);
    if (search.maxDistanceMiles) params.append('radius', search.maxDistanceMiles.toString());
    if (search.priceMin !== null) params.append('priceMin', search.priceMin.toString());
    if (search.priceMax !== null) params.append('priceMax', search.priceMax.toString());

    router.push(`/search?${params.toString()}`);
  }

  if (loading) {
    return <SavedSearchesSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">Saved Searches</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Saved Searches</h1>
          <p className="text-muted-foreground">Quick access to your favorite searches</p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            New Search
          </Link>
        </Button>
      </div>

      {/* Saved Searches List */}
      {savedSearches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {savedSearches.map((search) => (
            <Card key={search.id} className="hover:shadow-lg transition-shadow border-primary/20">
              <CardContent className="p-6 space-y-4">
                {/* Search Name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">
                      {search.searchName || 'Untitled Search'}
                    </h3>
                  </div>
                  {search.notifyNewMatches && (
                    <Badge variant="secondary" className="gap-1">
                      <Bell className="h-3 w-3" />
                      Notify
                    </Badge>
                  )}
                </div>

                {/* Search Criteria */}
                <div className="space-y-2 text-sm">
                  {(search.locationCity || search.locationState) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {search.locationCity}
                        {search.locationCity && search.locationState && ', '}
                        {search.locationState}
                      </span>
                      {search.maxDistanceMiles && (
                        <span className="text-xs">(within {search.maxDistanceMiles} miles)</span>
                      )}
                    </div>
                  )}

                  {(search.priceMin !== null || search.priceMax !== null) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {search.priceMin !== null && `$${search.priceMin}`}
                        {search.priceMin !== null && search.priceMax !== null && ' - '}
                        {search.priceMax !== null && `$${search.priceMax}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <p className="text-xs text-muted-foreground">
                  Saved {new Date(search.createdAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleRunSearch(search)}
                    className="flex-1 bg-button-dark hover:bg-button-dark/90"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Search
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleEditClick(search)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(search.id)}
                    disabled={deletingId === search.id}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 mx-auto mb-4 opacity-50 text-primary" />
          <h3 className="text-lg font-medium mb-2">No saved searches yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Save your favorite search filters for quick access later. Look for the "Save Search"
            button on the search page.
          </p>
          <Button asChild>
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Browse Services
            </Link>
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Saved Search</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Hair stylists near me"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notify-matches"
                checked={editNotify}
                onChange={(e) => setEditNotify(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="notify-matches" className="cursor-pointer">
                Notify me when new matches are found
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SavedSearchesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
