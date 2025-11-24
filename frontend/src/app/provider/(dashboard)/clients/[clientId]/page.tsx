'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  Plus,
  Edit,
  Trash,
  Save,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { ClientWithNotes, ClientNote } from '@/shared-types/client-management.types';
import { toast } from 'sonner';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientWithNotes | null>(null);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editedNoteText, setEditedNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadClientDetail();
  }, [clientId]);

  async function loadClientDetail() {
    try {
      setLoading(true);
      setError('');

      const response = await api.clients.getById(clientId);
      setClient(response.data.client);
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to load client details';
      setError(message);
      toast.error('Failed to load client', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    try {
      setSavingNote(true);
      await api.clients.createNote({
        clientId,
        note: newNote.trim(),
      });

      toast.success('Note added successfully');
      setNewNote('');
      await loadClientDetail();
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to add note';
      toast.error('Failed to add note', {
        description: message,
      });
    } finally {
      setSavingNote(false);
    }
  }

  async function handleUpdateNote(noteId: string) {
    if (!editedNoteText.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    try {
      setSavingNote(true);
      await api.clients.updateNote(noteId, { note: editedNoteText.trim() });

      toast.success('Note updated successfully');
      setEditingNote(null);
      setEditedNoteText('');
      await loadClientDetail();
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to update note';
      toast.error('Failed to update note', {
        description: message,
      });
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await api.clients.deleteNote(noteId);
      toast.success('Note deleted successfully');
      await loadClientDetail();
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to delete note';
      toast.error('Failed to delete note', {
        description: message,
      });
    }
  }

  function startEditNote(note: ClientNote) {
    setEditingNote(note.id);
    setEditedNoteText(note.note);
  }

  function cancelEditNote() {
    setEditingNote(null);
    setEditedNoteText('');
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Client not found'}</p>
            <Button onClick={loadClientDetail} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to Clients
      </Button>

      {/* Client Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={client.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(client.firstName, client.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold mb-2">
                {client.firstName} {client.lastName}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
              </div>
              {(client.hairType || client.hairTexture) && (
                <div className="flex gap-2 mt-3">
                  {client.hairType && <Badge variant="outline">{client.hairType}</Badge>}
                  {client.hairTexture && <Badge variant="outline">{client.hairTexture}</Badge>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats and Bookings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{client.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Total Bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(client.totalSpent)}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{client.completedBookings}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Recent appointments with this client</CardDescription>
            </CardHeader>
            <CardContent>
              {client.recentBookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.recentBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.serviceTitle}</TableCell>
                        <TableCell>{formatDate(booking.appointmentDate)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{booking.status.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(booking.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No booking history</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notes */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add notes about this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note about this client..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || savingNote}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {client.notes.map((note) => (
                  <div key={note.id} className="p-3 bg-muted rounded-lg space-y-2">
                    {editingNote === note.id ? (
                      <>
                        <Textarea
                          value={editedNoteText}
                          onChange={(e) => setEditedNoteText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={savingNote}
                            className="gap-1"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditNote}
                            disabled={savingNote}
                            className="gap-1"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditNote(note)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNote(note.id)}
                              className="h-7 w-7 p-0 text-destructive"
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {client.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No notes yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
