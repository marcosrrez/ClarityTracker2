import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Share2, TrendingUp, Calendar, MessageSquare, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ClientInvitationManager } from "@/components/client-portal/ClientInvitationManager";

interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  lastSession: Date;
  totalSessions: number;
  progressScore: number;
}

interface SharedInsight {
  id: string;
  clientId: string;
  title: string;
  content: string;
  type: 'goal' | 'progress' | 'breakthrough' | 'homework';
  sharedAt: Date;
  clientViewed: boolean;
}

export default function ClientPortal({ userId }: { userId: string }) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [newClientForm, setNewClientForm] = useState({ name: '', email: '' });
  const [newInsightForm, setNewInsightForm] = useState({ title: '', content: '', type: 'progress' });
  const [showAddClient, setShowAddClient] = useState(false);
  const [showShareInsight, setShowShareInsight] = useState(false);

  const queryClient = useQueryClient();

  // Fetch real client data
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients', userId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  const clients = clientsData?.clients || [];

  const sampleInsights: SharedInsight[] = [
    {
      id: '1',
      clientId: '1',
      title: 'Weekly Progress Update',
      content: 'Great progress with anxiety management techniques. Continue practicing daily breathing exercises.',
      type: 'progress',
      sharedAt: new Date('2024-06-04'),
      clientViewed: true
    },
    {
      id: '2',
      clientId: '1',
      title: 'Homework Assignment',
      content: 'Practice mindfulness meditation for 10 minutes daily and track mood in journal.',
      type: 'homework',
      sharedAt: new Date('2024-06-03'),
      clientViewed: false
    },
    {
      id: '3',
      clientId: '2',
      title: 'Breakthrough Moment',
      content: 'Excellent insight about relationship patterns during our session today.',
      type: 'breakthrough',
      sharedAt: new Date('2024-06-03'),
      clientViewed: true
    }
  ];

  const handleAddClient = () => {
    console.log('Adding client:', newClientForm);
    setNewClientForm({ name: '', email: '' });
    setShowAddClient(false);
  };

  const shareInsightMutation = useMutation({
    mutationFn: async (insightData: any) => {
      const response = await fetch('/api/insights/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insightData)
      });
      if (!response.ok) throw new Error('Failed to share insight');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insights/therapist', userId] });
      setNewInsightForm({ title: '', content: '', type: 'progress' });
      setShowShareInsight(false);
    }
  });

  const handleShareInsight = () => {
    if (!selectedClient || !newInsightForm.title || !newInsightForm.content) return;
    
    shareInsightMutation.mutate({
      therapistId: userId,
      clientId: selectedClient,
      title: newInsightForm.title,
      content: newInsightForm.content,
      type: newInsightForm.type,
      tags: []
    });
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-blue-100 text-blue-800';
      case 'progress': return 'bg-green-100 text-green-800';
      case 'breakthrough': return 'bg-purple-100 text-purple-800';
      case 'homework': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your clients and share therapeutic insights securely
          </p>
        </div>
        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your therapy practice. They will receive access to shared insights.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newClientForm.name}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter client's full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter client's email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddClient(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient}>Add Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Client Management
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Shared Insights
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress Tracking
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Client Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-6">
          {clientsLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading clients...</div>
            </div>
          ) : clients.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{client.firstName} {client.lastName}</CardTitle>
                        <CardDescription>{client.email}</CardDescription>
                      </div>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Portal Access:</span>
                        <span className="font-medium">{client.portalAccess ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Created:</span>
                        <span className="font-medium">{new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedClient(client.id);
                            setShowShareInsight(true);
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Insight
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No clients yet</div>
              <Button onClick={() => setShowAddClient(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {sampleInsights.map((insight) => {
              const client = sampleClients.find(c => c.id === insight.clientId);
              return (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {insight.title}
                          <Badge className={getInsightTypeColor(insight.type)}>
                            {insight.type}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Shared with {client?.name} on {insight.sharedAt.toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.clientViewed ? 'default' : 'secondary'}>
                          {insight.clientViewed ? 'Viewed' : 'Unread'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">{insight.content}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sampleClients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <CardDescription>Progress Overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {client.progressScore}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Overall Progress
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sessions Completed:</span>
                        <span className="font-medium">{client.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Activity:</span>
                        <span className="font-medium">{client.lastSession.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <ClientInvitationManager therapistId={userId} />
        </TabsContent>
      </Tabs>

      <Dialog open={showShareInsight} onOpenChange={setShowShareInsight}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Therapeutic Insight</DialogTitle>
            <DialogDescription>
              Share progress updates, goals, or homework with your client through the secure portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="insight-title">Insight Title</Label>
              <Input
                id="insight-title"
                value={newInsightForm.title}
                onChange={(e) => setNewInsightForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter insight title"
              />
            </div>
            <div>
              <Label htmlFor="insight-type">Type</Label>
              <select
                id="insight-type"
                value={newInsightForm.type}
                onChange={(e) => setNewInsightForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="progress">Progress Update</option>
                <option value="goal">Goal Setting</option>
                <option value="breakthrough">Breakthrough Moment</option>
                <option value="homework">Homework Assignment</option>
              </select>
            </div>
            <div>
              <Label htmlFor="insight-content">Content</Label>
              <Textarea
                id="insight-content"
                value={newInsightForm.content}
                onChange={(e) => setNewInsightForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter insight content..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareInsight(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareInsight}>Share Insight</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}