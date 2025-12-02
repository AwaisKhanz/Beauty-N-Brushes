'use client';

import { useState } from 'react';
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
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { InviteTeamMemberRequest } from '@/shared-types/team.types';
import { SERVICE_SPECIALIZATIONS } from '@/constants/services';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  role: z.enum(['stylist', 'manager', 'assistant']),
  specializations: z.array(z.string()).optional(),
  canManageBookings: z.boolean(),
  canManageServices: z.boolean(),
  canViewFinances: z.boolean(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteTeamMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteTeamMemberModal({ open, onClose, onSuccess }: InviteTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      displayName: '',
      role: 'stylist',
      specializations: [],
      canManageBookings: true,
      canManageServices: true,
      canViewFinances: false,
    },
  });

  async function onSubmit(values: InviteFormValues) {
    try {
      setLoading(true);
      setError('');

      const data: InviteTeamMemberRequest = {
        email: values.email,
        displayName: values.displayName,
        role: values.role,
        specializations: selectedSpecs,
        canManageBookings: values.canManageBookings,
        canManageServices: values.canManageServices,
        canViewFinances: values.canViewFinances,
      };

      await api.team.invite(data);
      form.reset();
      setSelectedSpecs([]);
      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to send invitation');
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
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to add a new team member to your salon
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="stylist@example.com" type="email" {...field} />
                  </FormControl>
                  <FormDescription>Invitation will be sent to this email</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>How their name will appear to clients</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stylist">Stylist</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Team member's role in the salon</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specializations */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Specializations (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                {SERVICE_SPECIALIZATIONS.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={spec}
                      checked={selectedSpecs.includes(spec)}
                      onCheckedChange={() => toggleSpecialization(spec)}
                    />
                    <label
                      htmlFor={spec}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {spec}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Select the services they specialize in
              </p>
            </div>

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
                      <FormDescription>Access financial reports and earnings</FormDescription>
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
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
