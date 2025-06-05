import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  Circle,
  Calendar,
  TrendingUp,
  Award,
  Play,
  Download,
  MessageCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  category: string;
  isCompleted: boolean;
  milestones: string[];
  completedMilestones: string[];
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'exercise' | 'worksheet' | 'book';
  url?: string;
  category: string;
  recommendedBy?: 'therapist' | 'system';
  estimatedTime?: string;
  isCompleted: boolean;
  createdAt: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  category: string;
  icon: string;
}

interface GrowthResourcesProps {
  clientId: string;
  therapistConnected?: boolean;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'article': return <FileText className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    case 'exercise': return <Target className="h-4 w-4" />;
    case 'worksheet': return <FileText className="h-4 w-4" />;
    case 'book': return <BookOpen className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'anxiety': return 'bg-blue-100 text-blue-800';
    case 'mindfulness': return 'bg-green-100 text-green-800';
    case 'communication': return 'bg-purple-100 text-purple-800';
    case 'stress': return 'bg-orange-100 text-orange-800';
    case 'relationships': return 'bg-pink-100 text-pink-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function GrowthResources({ clientId, therapistConnected = false }: GrowthResourcesProps) {
  const [createGoalOpen, setCreateGoalOpen] = useState(false);

  // Fetch goals
  const { data: goals = [] } = useQuery({
    queryKey: ['/api/goals', clientId],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        title: 'Manage Anxiety During Presentations',
        description: 'Practice breathing techniques and prepare coping strategies for work presentations',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 60,
        category: 'Anxiety',
        isCompleted: false,
        milestones: [
          'Learn 3 breathing techniques',
          'Practice with small group',
          'Complete full presentation',
          'Get feedback from colleagues'
        ],
        completedMilestones: [
          'Learn 3 breathing techniques',
          'Practice with small group'
        ]
      },
      {
        id: '2',
        title: 'Establish Daily Mindfulness Routine',
        description: 'Build a consistent 10-minute daily meditation practice',
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 85,
        category: 'Mindfulness',
        isCompleted: false,
        milestones: [
          'Download meditation app',
          'Complete 7 consecutive days',
          'Complete 14 consecutive days',
          'Share experience with therapist'
        ],
        completedMilestones: [
          'Download meditation app',
          'Complete 7 consecutive days',
          'Complete 14 consecutive days'
        ]
      }
    ] as Goal[]),
  });

  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources', clientId],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        title: 'Box Breathing Technique',
        description: 'A simple 4-4-4-4 breathing pattern to reduce anxiety and promote calm',
        type: 'exercise',
        category: 'Anxiety',
        recommendedBy: 'therapist',
        estimatedTime: '5 minutes',
        isCompleted: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: 'Mindful Communication Guide',
        description: 'Learn to communicate more effectively through mindfulness practices',
        type: 'article',
        url: 'https://example.com/mindful-communication',
        category: 'Communication',
        recommendedBy: 'system',
        estimatedTime: '15 minutes',
        isCompleted: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: 'Progressive Muscle Relaxation',
        description: 'Video guide for systematic tension and relaxation of muscle groups',
        type: 'video',
        url: 'https://example.com/pmr-video',
        category: 'Stress',
        recommendedBy: 'therapist',
        estimatedTime: '20 minutes',
        isCompleted: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ] as Resource[]),
  });

  // Fetch achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['/api/achievements', clientId],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        title: 'First Reflection',
        description: 'Completed your first journal reflection',
        earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Journaling',
        icon: '📝'
      },
      {
        id: '2',
        title: 'Breathing Master',
        description: 'Completed 5 breathing exercises',
        earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Anxiety',
        icon: '🌬️'
      },
      {
        id: '3',
        title: 'Week Warrior',
        description: 'Completed daily check-ins for 7 consecutive days',
        earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Consistency',
        icon: '🔥'
      }
    ] as Achievement[]),
  });

  const completedGoals = goals.filter(goal => goal.isCompleted).length;
  const totalGoals = goals.length;
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const completedResources = resources.filter(resource => resource.isCompleted).length;
  const totalResources = resources.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Growth & Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress, achieve your goals, and explore helpful resources
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {goals.filter(g => !g.isCompleted).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resources Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedResources}/{totalResources}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {achievements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="goals" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Resources</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Achievements</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals">
            <div className="space-y-6">
              {/* Add Goal Button */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Goals</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track progress toward your personal growth objectives
                  </p>
                </div>
                <Dialog open={createGoalOpen} onOpenChange={setCreateGoalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Goal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Goal Title</label>
                        <Input placeholder="What do you want to achieve?" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <Textarea placeholder="Describe your goal in detail..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Category</label>
                          <Input placeholder="e.g. Anxiety, Mindfulness..." />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Target Date</label>
                          <Input type="date" />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setCreateGoalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setCreateGoalOpen(false)}>
                          Create Goal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Goals List */}
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No goals yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Set your first goal to start tracking your progress
                      </p>
                      <Button onClick={() => setCreateGoalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Goal
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  goals.map((goal) => (
                    <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{goal.title}</CardTitle>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getCategoryColor(goal.category)}>
                              {goal.category}
                            </Badge>
                            {goal.isCompleted && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                          {goal.description}
                        </p>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium">Progress</span>
                            <span>{goal.progress}% complete</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-3">Milestones</h4>
                          <div className="space-y-2">
                            {goal.milestones.map((milestone, index) => {
                              const isCompleted = goal.completedMilestones.includes(milestone);
                              return (
                                <div key={index} className="flex items-center space-x-2">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400" />
                                  )}
                                  <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {milestone}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resources">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Resources</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Curated materials to support your growth journey
                </p>
              </div>

              <div className="grid gap-4">
                {resources.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No resources yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {therapistConnected 
                          ? 'Your therapist will share helpful resources with you'
                          : 'Connect with a therapist to receive personalized resources'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  resources.map((resource) => (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                              {getResourceIcon(resource.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {resource.title}
                                </h3>
                                {resource.url && (
                                  <ExternalLink className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {resource.description}
                              </p>
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <Badge className={getCategoryColor(resource.category)}>
                                  {resource.category}
                                </Badge>
                                {resource.estimatedTime && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{resource.estimatedTime}</span>
                                  </span>
                                )}
                                {resource.recommendedBy && (
                                  <span className="flex items-center space-x-1">
                                    <MessageCircle className="h-3 w-3" />
                                    <span>By {resource.recommendedBy}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {resource.isCompleted ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Button size="sm">
                                {resource.type === 'video' ? (
                                  <Play className="h-4 w-4 mr-1" />
                                ) : (
                                  <BookOpen className="h-4 w-4 mr-1" />
                                )}
                                {resource.type === 'video' ? 'Watch' : 'Read'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Achievements</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Celebrate your progress and milestones
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.length === 0 ? (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No achievements yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Keep working on your goals to earn your first achievement!
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  achievements.map((achievement) => (
                    <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-center space-x-2">
                          <Badge className={getCategoryColor(achievement.category)}>
                            {achievement.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}