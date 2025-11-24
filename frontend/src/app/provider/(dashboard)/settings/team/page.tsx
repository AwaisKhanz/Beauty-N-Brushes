'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  UserPlus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { InviteTeamMemberModal } from '@/components/settings/InviteTeamMemberModal';
import { EditTeamMemberModal } from '@/components/settings/EditTeamMemberModal';
import type { TeamMember } from '@/shared-types/team.types';

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [limit, setLimit] = useState(10);
  const [currentCount, setCurrentCount] = useState(0);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  async function fetchTeamMembers() {
    try {
      setLoading(true);
      setError('');

      const response = await api.team.getAll();
      setTeamMembers(response.data.teamMembers);
      setLimit(response.data.limit);
      setCurrentCount(response.data.currentCount);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err) || 'Failed to load team members';

      // Check if it's a "not a salon" error
      if (errorMsg.includes('only available for salon accounts')) {
        setError(
          'This feature is only available for salon accounts. Please upgrade your subscription tier.'
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(memberId: string, displayName: string) {
    if (
      !confirm(
        `Are you sure you want to remove ${displayName} from your team? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.team.delete(memberId);
      await fetchTeamMembers();
    } catch (err: unknown) {
      alert(extractErrorMessage(err) || 'Failed to remove team member');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Team Management"
        description="Manage your salon team members and permissions"
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SettingsLayout>
    );
  }

  if (error) {
    return (
      <SettingsLayout
        title="Team Management"
        description="Manage your salon team members and permissions"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Team Management"
      description="Manage your salon team members and permissions"
    >
      <div className="space-y-6">
        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{currentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">of {limit} limit</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {teamMembers.filter((m) => m.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {teamMembers.filter((m) => m.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">awaiting acceptance</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your salon staff and their permissions</CardDescription>
              </div>
              <Button
                onClick={() => setInviteModalOpen(true)}
                disabled={currentCount >= limit}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite Team Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your team by inviting stylists to join your salon
                </p>
                <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Your First Team Member
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Specializations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {member.user?.avatarUrl ? (
                            <Image
                              src={member.user.avatarUrl}
                              alt={member.displayName}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {member.displayName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{member.displayName}</p>
                            {member.user && (
                              <p className="text-sm text-muted-foreground">{member.user.email}</p>
                            )}
                            {member.invitedEmail && member.status === 'pending' && (
                              <p className="text-sm text-muted-foreground">{member.invitedEmail}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.specializations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.specializations.slice(0, 2).map((spec, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {member.specializations.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{member.specializations.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member);
                                setEditModalOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(member.id, member.displayName)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Team Limit Warning */}
            {currentCount >= limit && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've reached your team member limit ({limit}). Contact support to increase your
                  limit.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <InviteTeamMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={() => {
          setInviteModalOpen(false);
          fetchTeamMembers();
        }}
      />

      {selectedMember && (
        <EditTeamMemberModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedMember(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setSelectedMember(null);
            fetchTeamMembers();
          }}
          member={selectedMember}
        />
      )}
    </SettingsLayout>
  );
}
