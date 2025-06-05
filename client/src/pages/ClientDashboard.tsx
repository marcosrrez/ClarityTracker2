import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { Heart, Calendar, MessageSquare, TrendingUp, Bell, FileText, Target, Award, Plus, UserPlus, Sparkles, Brain, Clock, Share2 } from 'lucide-react';

interface SharedInsight {
  id: string;
  title: string;
  content: string;
  type: 'goal' | 'progress' | 'breakthrough' | 'homework';
  sharedAt: Date;
  therapistNote?: string;
}

interface ClientProgress {
  overallProgress: number;
  currentGoals: string[];
  completedSessions: number;
  nextAppointment: Date;
  recentAchievements: string[];
}

export default function ClientDashboard() {
  const [location, setLocation] = useLocation();
  const [inviteTherapistOpen, setInviteTherapistOpen] = useState(false);
  const [showSelfReflection, setShowSelfReflection] = useState(false);
  const [showSpacedRepetition, setShowSpacedRepetition] = useState(false);
  
  // Sample data demonstrating both standalone and connected accounts
  const clientInfo = {
    name: "Sarah Johnson",
    therapistName: null, // Set to null to show standalone account features
    memberSince: "March 2024",
    accountType: "standalone" // or "connected"
  };

  // For standalone accounts, show self-reflection insights instead of therapist insights
  const sharedInsights: SharedInsight[] = clientInfo.therapistName ? [
    {
      id: "1",
      title: "Weekly Reflection Completed",
      content: "Great progress on identifying stress triggers. Your awareness has improved significantly this week.",
      type: "progress",
      sharedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      therapistNote: "Continue practicing the mindfulness techniques we discussed."
    },
    {
      id: "2", 
      title: "New Coping Strategy",
      content: "Homework: Practice the 5-4-3-2-1 grounding technique daily for the next week.",
      type: "homework",
      sharedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      therapistNote: "Use this when you feel anxiety building up."
    }
  ] : [
    {
      id: "1",
      title: "Self-Reflection: Stress Patterns",
      content: "I noticed I feel most anxious during Monday morning meetings. Writing this down helps me see the pattern.",
      type: "progress",
      sharedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: "2",
      title: "Personal Goal Set",
      content: "Goal: Practice deep breathing for 5 minutes every morning this week.",
      type: "goal",
      sharedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "3",
      title: "Breakthrough Moment",
      content: "Successfully used the breathing technique I learned from my reflection during today's stressful situation.",
      type: "breakthrough",
      sharedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const progress: ClientProgress = {
    overallProgress: 73,
    currentGoals: [
      "Reduce anxiety in social situations",
      "Improve sleep quality", 
      "Practice daily mindfulness"
    ],
    completedSessions: 8,
    nextAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    recentAchievements: [
      "Completed first month of therapy",
      "Used coping strategies independently", 
      "Improved sleep schedule"
    ]
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4" />;
      case 'progress': return <TrendingUp className="h-4 w-4" />;
      case 'breakthrough': return <Award className="h-4 w-4" />;
      case 'homework': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'goal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'progress': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'breakthrough': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'homework': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 shadow-sm border-b border-blue-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Heart className="h-8 w-8 text-blue-600" />
                <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Welcome back, {clientInfo.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {clientInfo.therapistName ? 
                    `Working with ${clientInfo.therapistName} • Member since ${clientInfo.memberSince}` :
                    `Standalone account • Member since ${clientInfo.memberSince}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!clientInfo.therapistName && (
                <Button onClick={() => setInviteTherapistOpen(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Therapist
                </Button>
              )}
              <Button onClick={() => setLocation('/')} variant="outline">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Your Progress</span>
                </CardTitle>
                <CardDescription>
                  Overall therapy progress and achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{progress.overallProgress}%</span>
                  </div>
                  <Progress value={progress.overallProgress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{progress.completedSessions}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sessions Completed</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{progress.currentGoals.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Goals</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{progress.recentAchievements.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recent Achievements</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Self-Reflection or Shared Insights */}
            <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-blue-100/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {clientInfo.therapistName ? <MessageSquare className="h-5 w-5 text-blue-600" /> : <Brain className="h-5 w-5 text-purple-600" />}
                    <span>{clientInfo.therapistName ? 'Shared Insights' : 'Self-Reflection Journal'}</span>
                  </div>
                  {!clientInfo.therapistName && (
                    <Button 
                      size="sm" 
                      onClick={() => setShowSelfReflection(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Reflection
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {clientInfo.therapistName ? 
                    'Updates and insights shared by your therapist' :
                    'Your personal insights, patterns, and growth moments'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sharedInsights.map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getInsightIcon(insight.type)}
                          <h3 className="font-semibold">{insight.title}</h3>
                        </div>
                        <Badge className={getInsightColor(insight.type)}>
                          {insight.type}
                        </Badge>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{insight.content}</p>
                      {insight.therapistNote && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                          Note: {insight.therapistNote}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Shared {insight.sharedAt.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Appointment or Standalone Tools */}
            {clientInfo.therapistName ? (
              <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-blue-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Next Session</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {progress.nextAppointment.toLocaleDateString()}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {progress.nextAppointment.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Set Reminder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-green-100/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Spaced Repetition</span>
                  </CardTitle>
                  <CardDescription>
                    Build long-term memory of insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>3 insights</strong> ready for review
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    onClick={() => setShowSpacedRepetition(true)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Review
                  </Button>
                  <div className="text-xs text-slate-500">
                    Next review: Tomorrow at 9:00 AM
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Goals */}
            <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-blue-100/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Current Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {progress.currentGoals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100/50">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{goal}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-green-100/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span>Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {progress.recentAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-100/50">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Standalone Account: Invite Therapist CTA */}
            {!clientInfo.therapistName && (
              <Card className="backdrop-blur-sm bg-gradient-to-br from-emerald-50/70 to-green-50/70 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Share2 className="h-5 w-5 text-emerald-600" />
                    <span>Ready for Professional Support?</span>
                  </CardTitle>
                  <CardDescription>
                    Connect with a licensed therapist to enhance your journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    You've built a solid foundation with self-reflection. Consider inviting a therapist to:
                  </div>
                  <ul className="text-xs text-slate-500 space-y-1 ml-4">
                    <li>• Share your insights and progress</li>
                    <li>• Get professional guidance</li>
                    <li>• Accelerate your growth</li>
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                    onClick={() => setInviteTherapistOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite a Therapist
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}