import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Bell, Eye, MessageCircle, Target, Award, Clock, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface SupervisorInsight {
  id: string;
  supervisorId: string;
  superviseeId: string;
  title: string;
  content: string;
  type: 'guidance' | 'feedback' | 'development' | 'recognition';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  category?: string;
  actionRequired: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const insightFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(['guidance', 'feedback', 'development', 'recognition']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().optional(),
  actionRequired: z.boolean().default(false),
  dueDate: z.string().optional(),
});

type InsightFormData = z.infer<typeof insightFormSchema>;

interface SupervisorInsightsProps {
  superviseeId: string;
  supervisorId?: string;
  mode: 'supervisee' | 'supervisor';
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'guidance': return <MessageCircle className="h-4 w-4" />;
    case 'feedback': return <Eye className="h-4 w-4" />;
    case 'development': return <Target className="h-4 w-4" />;
    case 'recognition': return <Award className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function SupervisorInsights({ superviseeId, supervisorId, mode }: SupervisorInsightsProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InsightFormData>({
    resolver: zodResolver(insightFormSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'guidance',
      priority: 'normal',
      category: '',
      actionRequired: false,
      dueDate: '',
    },
  });

  // Fetch insights based on mode
  const { data: insights = [], isLoading } = useQuery({
    queryKey: mode === 'supervisee' 
      ? ['/api/supervisor-insights/supervisee', superviseeId]
      : ['/api/supervisor-insights/supervisor', supervisorId],
    enabled: !!(mode === 'supervisee' ? superviseeId : supervisorId),
  });

  // Create insight mutation
  const createInsightMutation = useMutation({
    mutationFn: (data: InsightFormData & { superviseeId: string; supervisorId: string }) =>
      apiRequest('/api/supervisor-insights', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/supervisor-insights']
      });
      setCreateDialogOpen(false);
      form.reset();
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (insightId: string) =>
      apiRequest(`/api/supervisor-insights/${insightId}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/supervisor-insights']
      });
    },
  });

  const onSubmit = (data: InsightFormData) => {
    if (!supervisorId || !superviseeId) return;
    
    createInsightMutation.mutate({
      ...data,
      superviseeId,
      supervisorId,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    });
  };

  const handleMarkAsRead = (insightId: string) => {
    markAsReadMutation.mutate(insightId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'supervisee' ? 'Supervisor Insights' : 'Shared Insights'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'supervisee' 
              ? 'Insights and feedback from your supervisor'
              : 'Insights you\'ve shared with supervisees'
            }
          </p>
        </div>
        
        {mode === 'supervisor' && supervisorId && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Share Insight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share Supervisor Insight</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Insight title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share your insight..." 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="guidance">Guidance</SelectItem>
                              <SelectItem value="feedback">Feedback</SelectItem>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="recognition">Recognition</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Clinical Skills, Documentation..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="actionRequired"
                      {...form.register('actionRequired')}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="actionRequired" className="text-sm font-medium">
                      Action Required
                    </label>
                  </div>
                  
                  {form.watch('actionRequired') && (
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createInsightMutation.isPending}>
                      {createInsightMutation.isPending ? 'Sharing...' : 'Share Insight'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {insights.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No insights yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {mode === 'supervisee' 
                  ? 'Your supervisor hasn\'t shared any insights yet.'
                  : 'You haven\'t shared any insights with this supervisee yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          insights.map((insight: SupervisorInsight) => (
            <Card key={insight.id} className={`${!insight.isRead ? 'ring-2 ring-blue-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-blue-100 text-blue-600`}>
                      {getTypeIcon(insight.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority}
                        </Badge>
                        <Badge variant="outline">
                          {insight.type}
                        </Badge>
                        {insight.category && (
                          <Badge variant="secondary">
                            {insight.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {insight.actionRequired && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    {!insight.isRead && mode === 'supervisee' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(insight.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {insight.content}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(insight.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {insight.dueDate && (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Due: {format(new Date(insight.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  
                  {insight.isRead ? (
                    <span className="text-green-600">Read</span>
                  ) : (
                    <span className="text-blue-600 font-medium">Unread</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}