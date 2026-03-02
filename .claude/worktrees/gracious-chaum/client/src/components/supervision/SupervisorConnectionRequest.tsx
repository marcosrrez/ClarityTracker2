import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, UserPlus } from 'lucide-react';

export function SupervisorConnectionRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const requestConnection = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/supervision/request-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your supervisor will receive an email notification to approve your request.",
      });
      setSupervisorEmail('');
      setLicenseNumber('');
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/requests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supervisorEmail || !licenseNumber) {
      toast({
        title: "Missing Information",
        description: "Please provide both your supervisor's email and your LAC license number.",
        variant: "destructive",
      });
      return;
    }

    requestConnection.mutate({
      superviseeId: user?.uid,
      superviseeName: user?.displayName || user?.email,
      superviseeEmail: user?.email,
      supervisorEmail,
      licenseNumber,
      lacDate: new Date(), // This should come from user profile
      message: `Hi, I'm ${user?.displayName || user?.email} and I'd like to connect my hour tracking to your supervision. My LAC license number is ${licenseNumber}.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Connect to Your Supervisor
        </CardTitle>
        <CardDescription>
          Send a connection request to your supervisor to automatically share your hour tracking and progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supervisorEmail">Supervisor's Email</Label>
            <Input
              id="supervisorEmail"
              type="email"
              placeholder="supervisor@example.com"
              value={supervisorEmail}
              onChange={(e) => setSupervisorEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">Your LAC License Number</Label>
            <Input
              id="licenseNumber"
              placeholder="LAC-12345"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">What happens next?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your supervisor receives an email notification</li>
              <li>• They can approve your request from their dashboard</li>
              <li>• Once approved, your hours automatically appear on their tracking</li>
              <li>• Session notes and evaluations become shared between you</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={requestConnection.isPending}
          >
            {requestConnection.isPending ? (
              "Sending Request..."
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Connection Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}