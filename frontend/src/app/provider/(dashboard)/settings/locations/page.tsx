'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Star,
  Trash2,
  Plus,
  MapPin,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type {
  CreateLocationRequest,
  UpdateLocationManagementRequest,
  ProviderLocation,
} from '@/shared-types/location.types';

const locationSchema = z.object({
  name: z.string().max(255).optional(),
  addressLine1: z.string().min(1, 'Address is required').max(255),
  addressLine2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(50),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  country: z.string().min(1, 'Country is required').max(50),
  businessPhone: z.string().max(20).optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

export default function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locations, setLocations] = useState<ProviderLocation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ProviderLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<ProviderLocation | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      businessPhone: '',
      isPrimary: false,
    },
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      setLoading(true);
      setError('');

      const response = await api.locations.getAll();
      setLocations(response.data.locations);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  function handleAddLocation() {
    setEditingLocation(null);
    form.reset({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      businessPhone: '',
      isPrimary: false,
    });
    setIsDialogOpen(true);
  }

  function handleEditLocation(location: ProviderLocation) {
    setEditingLocation(location);
    form.reset({
      name: location.name || '',
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2 || '',
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      country: location.country,
      businessPhone: location.businessPhone || '',
      isPrimary: location.isPrimary,
    });
    setIsDialogOpen(true);
  }

  async function handleDeleteLocation(location: ProviderLocation) {
    if (!confirm(`Are you sure you want to delete "${location.name || 'this location'}"?`)) {
      return;
    }

    try {
      setDeletingLocation(location);
      await api.locations.delete(location.id);
      setSuccess('Location deleted successfully');
      await fetchLocations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to delete location');
    } finally {
      setDeletingLocation(null);
    }
  }

  async function onSubmit(values: LocationFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editingLocation) {
        const updateData: UpdateLocationManagementRequest = {
          name: values.name || undefined,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2 || null,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country,
          businessPhone: values.businessPhone || null,
          isPrimary: values.isPrimary || false,
          isActive: true,
        };
        await api.locations.update(editingLocation.id, updateData);
        setSuccess('Location updated successfully');
      } else {
        const createData: CreateLocationRequest = {
          name: values.name || undefined,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2 || null,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: values.country,
          businessPhone: values.businessPhone || null,
          isPrimary: values.isPrimary || false,
        };
        await api.locations.create(createData);
        setSuccess('Location created successfully');
      }

      setIsDialogOpen(false);
      await fetchLocations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Locations"
        description="Manage multiple business locations"
      >
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Locations" description="Manage multiple business locations">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Add Location Button */}
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddLocation} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first location to get started
              </p>
              <Button onClick={handleAddLocation} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Location
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {location.name || 'Unnamed Location'}
                      {location.isPrimary && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      )}
                      {!location.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {location.addressLine1}
                      {location.addressLine2 && `, ${location.addressLine2}`}
                      <br />
                      {location.city}, {location.state} {location.zipCode}
                      <br />
                      {location.country}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLocation(location)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLocation(location)}
                    disabled={deletingLocation?.id === location.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update location details'
                : 'Add a new business location for your services'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Location Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Location, Downtown Branch" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this location
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Line 1 */}
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1 *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Line 2 */}
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, Unit, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City, State, Zip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province *</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Country */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input placeholder="US" {...field} />
                    </FormControl>
                    <FormDescription>2-letter country code (e.g., US, GH, NG)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Phone */}
              <FormField
                control={form.control}
                name="businessPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Primary Location */}
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Set as Primary Location</FormLabel>
                      <FormDescription>
                        This will be your main location shown to clients first
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Coordinates (latitude/longitude) will be automatically calculated from your address.
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingLocation ? 'Update Location' : 'Add Location'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}

