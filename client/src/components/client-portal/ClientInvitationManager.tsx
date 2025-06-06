import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Mail, Plus, UserPlus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const inviteClientSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required")
});

type InviteClientForm = z.infer<typeof inviteClientSchema>;

interface ClientInvitationManagerProps {
  therapistId: string;
}

export function ClientInvitationManager({ therapistId }: ClientInvitationManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<Array<{
    id: string;
    clientName: string;
    clientEmail: string;
    inviteUrl: string;
    status: 'pending' | 'accepted' | 'expired';
    sentAt: Date;
    expiresAt: Date;
  }>>([]);
  const { toast } = useToast();

  const form = useForm<InviteClientForm>({
    resolver: zodResolver(inviteClientSchema),
    defaultValues: {
      clientName: '',
      clientEmail: ''
    }
  });

  const onSubmit = async (data: InviteClientForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/client-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistId,
          ...data
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        setSentInvitations(prev => [...prev, {
          id: crypto.randomUUID(),
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          inviteUrl: result.inviteUrl,
          status: 'pending',
          sentAt: new Date(),
          expiresAt: new Date(result.expiresAt)
        }]);

        toast({
          title: "Invitation Sent!",
          description: `Invitation sent to ${data.clientName} at ${data.clientEmail}`
        });

        form.reset();
        setIsDialogOpen(false);
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      toast({
        title: "Failed to Send Invitation",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied!",
        description: "Invitation URL copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the URL manually",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Client Invitations
            </CardTitle>
            <CardDescription>
              Invite clients to access their therapy portal and view shared insights
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Invite Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Client</DialogTitle>
                <DialogDescription>
                  Send a secure invitation link to your client to access their therapy portal
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter client's full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder="client@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sentInvitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No invitations sent yet</p>
            <p className="text-sm text-gray-400">
              Start by inviting your first client to join their therapy portal
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sentInvitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{invitation.clientName}</h4>
                    <p className="text-sm text-gray-600">{invitation.clientEmail}</p>
                  </div>
                  <Badge className={getStatusColor(invitation.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(invitation.status)}
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </div>
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Sent: {invitation.sentAt.toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Expires: {invitation.expiresAt.toLocaleDateString()}</span>
                </div>
                
                {invitation.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={invitation.inviteUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteUrl(invitation.inviteUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}