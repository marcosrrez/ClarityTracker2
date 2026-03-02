import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Heart, 
  Lightbulb, 
  Target,
  Calendar,
  User,
  MessageCircle,
  Award,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Reflection {
  id: string;
  content: string;
  mood?: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
}

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

const reflectionFormSchema = z.object({
  content: z.string().min(1, "Reflection content is required"),
  mood: z.enum(['great', 'good', 'okay', 'challenging', 'difficult']).optional(),
  tags: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

type ReflectionFormData = z.infer<typeof reflectionFormSchema>;

interface ReflectionJournalProps {
  clientId: string;
  supervisorConnected?: boolean;
}

const getInsightTypeIcon = (type: string) => {
  switch (type) {
    case 'guidance': return <MessageCircle className="h-4 w-4" />;
    case 'feedback': return <Eye className="h-4 w-4" />;
    case 'development': return <Target className="h-4 w-4" />;
    case 'recognition': return <Award className="h-4 w-4" />;
    default: return <Lightbulb className="h-4 w-4" />;
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

const getMoodColor = (mood: string) => {
  switch (mood) {
    case 'great': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'okay': return 'bg-yellow-100 text-yellow-800';
    case 'challenging': return 'bg-orange-100 text-orange-800';
    case 'difficult': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function ReflectionJournal({ clientId, supervisorConnected = false }: ReflectionJournalProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const queryClient = useQueryClient();

  const form = useForm<ReflectionFormData>({
    resolver: zodResolver(reflectionFormSchema),
    defaultValues: {
      content: '',
      mood: undefined,
      tags: '',
      isPrivate: false,
    },
  });

  // Fetch reflections (mock for now)
  const { data: reflections = [] } = useQuery({
    queryKey: ['/api/reflections', clientId],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        content: 'Had a breakthrough today understanding my anxiety patterns. The breathing exercises really helped during my presentation.',
        mood: 'good',
        tags: ['anxiety', 'breathing', 'presentation'],
        isPrivate: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        content: 'Struggling with work-life balance. Feel overwhelmed with deadlines but trying to practice the mindfulness techniques we discussed.',
        mood: 'challenging',
        tags: ['work-life-balance', 'mindfulness', 'stress'],
        isPrivate: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ] as Reflection[]),
  });

  // Fetch supervisor insights
  const { data: supervisorInsights = [] } = useQuery({
    queryKey: ['/api/supervisor-insights/supervisee', clientId],
    enabled: supervisorConnected,
    queryFn: () => Promise.resolve([
      {
        id: '1',
        supervisorId: 'supervisor1',
        superviseeId: clientId,
        title: 'Great Progress on Anxiety Management',
        content: 'Your recent reflections show significant improvement in recognizing anxiety triggers. The breathing techniques are clearly helping. Consider exploring progressive muscle relaxation as the next step.',
        type: 'recognition',
        priority: 'normal',
        isRead: false,
        category: 'Anxiety Management',
        actionRequired: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        supervisorId: 'supervisor1',
        superviseeId: clientId,
        title: 'Mindfulness Practice Assignment',
        content: 'Based on your recent reflections about work stress, try the 5-4-3-2-1 grounding technique during overwhelming moments. Practice twice daily for the next week.',
        type: 'guidance',
        priority: 'high',
        isRead: true,
        category: 'Mindfulness',
        actionRequired: true,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ] as SupervisorInsight[]),
  });

  // Mark insight as read mutation
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

  const onSubmit = (data: ReflectionFormData) => {
    // Create reflection - would integrate with real API
    console.log('Creating reflection:', {
      ...data,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
      clientId,
    });
    setCreateDialogOpen(false);
    form.reset();
  };

  const handleMarkAsRead = (insightId: string) => {
    markAsReadMutation.mutate(insightId);
  };

  const filteredReflections = reflections.filter(reflection => {
    const matchesSearch = searchQuery === '' || 
      reflection.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reflection.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'private' && reflection.isPrivate) ||
      (selectedFilter === 'shared' && !reflection.isPrivate) ||
      (selectedFilter === reflection.mood);
    
    return matchesSearch && matchesFilter;
  });

  const filteredInsights = supervisorInsights.filter(insight => {
    const matchesSearch = searchQuery === '' || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insight.category && insight.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' ||
      selectedFilter === insight.type ||
      selectedFilter === insight.priority ||
      (selectedFilter === 'unread' && !insight.isRead) ||
      (selectedFilter === 'action-required' && insight.actionRequired);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reflection Journal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal space for thoughts, insights, and growth
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search reflections and insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="great">Great mood</SelectItem>
                <SelectItem value="good">Good mood</SelectItem>
                <SelectItem value="okay">Okay mood</SelectItem>
                <SelectItem value="challenging">Challenging</SelectItem>
                <SelectItem value="difficult">Difficult</SelectItem>
                {supervisorConnected && (
                  <>
                    <SelectItem value="unread">Unread insights</SelectItem>
                    <SelectItem value="action-required">Action required</SelectItem>
                    <SelectItem value="guidance">Guidance</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="recognition">Recognition</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="reflections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reflections" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>My Reflections</span>
            </TabsTrigger>
            {supervisorConnected && (
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Supervisor Insights</span>
                {supervisorInsights.filter(i => !i.isRead).length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {supervisorInsights.filter(i => !i.isRead).length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reflections">
            <div className="space-y-6">
              {/* Add Reflection Button */}
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reflection
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>New Reflection</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What's on your mind?</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Share your thoughts, feelings, or insights..." 
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
                          name="mood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mood (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="How are you feeling?" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="great">Great</SelectItem>
                                  <SelectItem value="good">Good</SelectItem>
                                  <SelectItem value="okay">Okay</SelectItem>
                                  <SelectItem value="challenging">Challenging</SelectItem>
                                  <SelectItem value="difficult">Difficult</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="anxiety, growth, therapy..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          {...form.register('isPrivate')}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="isPrivate" className="text-sm font-medium">
                          Keep this reflection private
                        </label>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          Save Reflection
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Reflections Grid */}
              <div className="grid gap-6">
                {filteredReflections.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No reflections yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start your journey by adding your first reflection
                      </p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Reflection
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredReflections.map((reflection) => (
                    <Card key={reflection.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {format(new Date(reflection.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {reflection.mood && (
                              <Badge className={getMoodColor(reflection.mood)}>
                                {reflection.mood}
                              </Badge>
                            )}
                            {reflection.isPrivate && (
                              <Badge variant="outline">Private</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {reflection.content}
                        </p>
                        
                        {reflection.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {reflection.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {supervisorConnected && (
            <TabsContent value="insights">
              <div className="space-y-6">
                {filteredInsights.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No insights yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Your therapist hasn't shared any insights yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredInsights.map((insight) => (
                    <Card key={insight.id} className={`${!insight.isRead ? 'ring-2 ring-blue-200' : ''} hover:shadow-lg transition-shadow`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                              {getInsightTypeIcon(insight.type)}
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
                              <Badge variant="destructive">Action Required</Badge>
                            )}
                            {!insight.isRead && (
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
                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
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
                                <Calendar className="h-4 w-4" />
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}