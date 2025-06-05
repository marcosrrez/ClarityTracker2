import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { insertClientSchema, insertSharedInsightSchema } from '@shared/schema';
import type { Client, SharedInsight } from '@shared/schema';
import { z } from 'zod';
import { Plus, Users, MessageSquare, TrendingUp, Calendar, Eye, EyeOff, Heart, Brain, Target, BookOpen } from 'lucide-react';

interface ClientPortalProps {
  userId: string;
}

export default function ClientPortal({ userId }: ClientPortalProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddInsight, setShowAddInsight] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients for this therapist
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['/api/clients', userId],
    queryFn: () => apiRequest(`/api/clients/${userId}`),
  });

  // Fetch insights for selected client or all clients
  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/insights/therapist', userId, selectedClient?.id],
    queryFn: () => apiRequest(`/api/insights/therapist/${userId}${selectedClient ? `?clientId=${selectedClient.id}` : ''}`),
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertClientSchema>) => 
      apiRequest('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowAddClient(false);
      toast({ title: "Client added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add client", variant: "destructive" });
    },
  });

  // Add insight mutation
  const addInsightMutation = useMutation({
    mutationFn: (data: z.infer<typeof insertSharedInsightSchema>) => 
      apiRequest('/api/insights', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insights'] });
      setShowAddInsight(false);
      toast({ title: "Insight shared successfully" });
    },
    onError: () => {
      toast({ title: "Failed to share insight", variant: "destructive" });
    },
  });

  // Client form
  const clientForm = useForm<z.infer<typeof insertClientSchema>>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      therapistId: userId,
      firstName: '',
      lastName: '',
      email: '',
      status: 'active',
      portalAccess: true,
      consentToShare: false,
    },
  });

  // Insight form
  const insightForm = useForm<z.infer<typeof insertSharedInsightSchema>>({
    resolver: zodResolver(insertSharedInsightSchema),
    defaultValues: {
      therapistId: userId,
      clientId: '',
      type: 'insight',
      title: '',
      content: '',
      priority: 'normal',
      tags: [],
    },
  });

  const clients = clientsData?.clients || [];
  const insights = insightsData?.insights || [];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Brain className="w-4 h-4" />;
      case 'milestone': return <Target className="w-4 h-4" />;
      case 'homework': return <BookOpen className="w-4 h-4" />;
      case 'resource': return <Heart className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'progress': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'breakthrough': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'challenge': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'growth': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your clients and share insights for better therapeutic outcomes
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Create a client profile and enable portal access for shared insights
                </DialogDescription>
              </DialogHeader>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit((data) => addClientMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clientForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddClient(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addClientMutation.isPending}>
                      {addClientMutation.isPending ? 'Adding...' : 'Add Client'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Your Clients ({clients.length})
              </CardTitle>
              <CardDescription>
                Select a client to view and manage shared insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No clients added yet</p>
                  <p className="text-sm">Add your first client to start sharing insights</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant={selectedClient === null ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedClient(null)}
                  >
                    <div className="text-left">
                      <p className="font-medium">All Clients</p>
                      <p className="text-sm text-gray-500">View insights for all clients</p>
                    </div>
                  </Button>
                  {clients.map((client: Client) => (
                    <Button
                      key={client.id}
                      variant={selectedClient?.id === client.id ? "default" : "ghost"}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{client.firstName} {client.lastName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {client.status}
                          </Badge>
                          {client.portalAccess ? (
                            <Eye className="w-3 h-3 text-green-600" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Shared Insights
                    {selectedClient && (
                      <span className="ml-2 text-base font-normal text-gray-600 dark:text-gray-300">
                        for {selectedClient.firstName} {selectedClient.lastName}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {selectedClient 
                      ? "Insights shared with this specific client"
                      : "All insights shared across your client base"
                    }
                  </CardDescription>
                </div>
                {selectedClient && (
                  <Dialog open={showAddInsight} onOpenChange={setShowAddInsight}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Share Insight
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Share New Insight</DialogTitle>
                        <DialogDescription>
                          Create an insight to share with {selectedClient.firstName} {selectedClient.lastName}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...insightForm}>
                        <form onSubmit={insightForm.handleSubmit((data) => addInsightMutation.mutate({ ...data, clientId: selectedClient.id }))} className="space-y-4">
                          <FormField
                            control={insightForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="insight">Session Insight</SelectItem>
                                    <SelectItem value="milestone">Milestone</SelectItem>
                                    <SelectItem value="homework">Homework</SelectItem>
                                    <SelectItem value="resource">Resource</SelectItem>
                                    <SelectItem value="note">Note</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={insightForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Brief title for this insight" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={insightForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Share your insight, observation, or resource with your client"
                                    rows={4}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={insightForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="progress">Progress</SelectItem>
                                    <SelectItem value="breakthrough">Breakthrough</SelectItem>
                                    <SelectItem value="challenge">Challenge</SelectItem>
                                    <SelectItem value="growth">Growth</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setShowAddInsight(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addInsightMutation.isPending}>
                              {addInsightMutation.isPending ? 'Sharing...' : 'Share Insight'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No insights shared yet</p>
                  <p className="text-sm mt-2">
                    {selectedClient 
                      ? "Start sharing meaningful insights with this client"
                      : "Select a client to share insights and foster better therapeutic outcomes"
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight: SharedInsight) => (
                    <div key={insight.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {insight.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          {insight.category && (
                            <Badge className={`text-xs ${getCategoryColor(insight.category)}`}>
                              {insight.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {insight.isRead ? (
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Read</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              <span>Unread</span>
                            </div>
                          )}
                          <span>•</span>
                          <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                        {insight.content}
                      </p>
                      {insight.tags && insight.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {insight.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}