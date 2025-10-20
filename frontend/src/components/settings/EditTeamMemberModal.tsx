'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { TeamMember, UpdateTeamMemberRequest } from '@/shared-types/team.types';
import { SERVICE_SPECIALIZATIONS } from '@/constants/services';

const editSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  role: z.enum(['stylist', 'manager', 'assistant']),
  status: z.enum(['active', 'inactive']),
  bio: z.string().optional().or(z.literal('')),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  canManageBookings: z.boolean(),
  canManageServices: z.boolean(),
  canViewFinances: z.boolean(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditTeamMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: TeamMember;
}

export function EditTeamMemberModal({
  open,
  onClose,
  onSuccess,
  member,
}: EditTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      displayName: member.displayName,
      role: member.role as 'stylist' | 'manager' | 'assistant',
      status: member.status as 'active' | 'inactive',
      bio: member.bio || '',
      commissionRate: member.commissionRate || 0,
      canManageBookings: member.canManageBookings,
      canManageServices: member.canManageServices,
      canViewFinances: member.canViewFinances,
    },
  });

  useEffect(() => {
    if (member) {
      setSelectedSpecs(member.specializations || []);
      form.reset({
        displayName: member.displayName,
        role: member.role as 'stylist' | 'manager' | 'assistant',
        status: member.status as 'active' | 'inactive',
        bio: member.bio || '',
        commissionRate: member.commissionRate || 0,
        canManageBookings: member.canManageBookings,
        canManageServices: member.canManageServices,
        canViewFinances: member.canViewFinances,
      });
    }
  }, [member, form]);

  async function onSubmit(values: EditFormValues) {
    try {
      setLoading(true);
      setError('');

      const data: UpdateTeamMemberRequest = {
        displayName: values.displayName,
        role: values.role,
        status: values.status,
        bio: values.bio || null,
        specializations: selectedSpecs,
        commissionRate: values.commissionRate || null,
        canManageBookings: values.canManageBookings,
        canManageServices: values.canManageServices,
        canViewFinances: values.canViewFinances,
      };

      await api.team.update(member.id, data);
      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update team member');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    form.reset();
    setSelectedSpecs([]);
    setError('');
    onClose();
  }

  function toggleSpecialization(spec: string) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Team Member
          </DialogTitle>
          <DialogDescription>Update team member information and permissions</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Sarah Johnson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stylist">Stylist</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell clients about this team member's experience and specialties..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specializations */}
            <div className="space-y-2">
              <FormLabel>Specializations</FormLabel>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {SERVICE_SPECIALIZATIONS.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${spec}`}
                      checked={selectedSpecs.includes(spec)}
                      onCheckedChange={() => toggleSpecialization(spec)}
                    />
                    <label
                      htmlFor={`edit-${spec}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {spec}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Rate */}
            <FormField
              control={form.control}
              name="commissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" placeholder="50" {...field} />
                  </FormControl>
                  <FormDescription>Percentage of revenue this team member receives</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permissions */}
            <div className="space-y-3 border rounded-lg p-4">
              <h4 className="font-semibold text-sm">Permissions</h4>

              <FormField
                control={form.control}
                name="canManageBookings"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Manage Bookings</FormLabel>
                      <FormDescription>View and manage all bookings</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canManageServices"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Manage Services</FormLabel>
                      <FormDescription>Create and edit services</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canViewFinances"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>View Finances</FormLabel>
                      <FormDescription>Access financial reports</FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
