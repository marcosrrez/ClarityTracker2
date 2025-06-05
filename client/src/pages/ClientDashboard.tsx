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
            {/* Exact LAC Welcome Card Design */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 pb-16 border border-white/20 shadow-lg relative">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2 text-black dark:text-white tracking-tight">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return "Good morning,";
                      if (hour < 17) return "Good afternoon,";
                      if (hour < 22) return "Good evening,";
                      return "Working late,";
                    })()}
                  </h1>
                  <h2 className="text-4xl font-bold mb-2 text-black dark:text-white tracking-tight">
                    {clientInfo.name.split(' ')[0]}!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-relaxed max-w-lg">
                    {clientInfo.therapistName ? 
                      "You're building momentum! Each session gets you closer to your personal growth goals." :
                      "You're building momentum! Each reflection gets you closer to self-discovery and growth."
                    }
                  </p>
                </div>
                
                {/* Progress Ring - Exact LAC Style */}
                <div className="relative">
                  <div className="w-24 h-24 relative">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="100, 100"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#007AFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min((progress.completedSessions * 15), 100)}, 100`}
                        className="transition-all duration-1500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-black dark:text-white">
                        {progress.completedSessions}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {clientInfo.therapistName ? 'sessions' : 'reflections'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Activity Indicator */}
              <div className="absolute bottom-8 left-8">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600 font-medium text-sm">Strong week</div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="absolute bottom-8 right-8">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium"
                  onClick={() => clientInfo.therapistName ? setShowSelfReflection(true) : setShowSelfReflection(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {clientInfo.therapistName ? 'Log Session' : 'Add Reflection'}
                </Button>
              </div>
            </div>

            {/* Progress Overview Card */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1">
                  <h2 className="text-4xl font-bold mb-2 text-black dark:text-white tracking-tight">
                    Your Progress
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-relaxed">
                    {clientInfo.therapistName ? 
                      'Track your therapeutic journey and shared insights' :
                      'Building self-awareness through reflection and growth'
                    }
                  </p>
                </div>
                
                <div className="relative">
                  <div className="w-24 h-24 relative">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="100, 100"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#007AFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${progress.overallProgress}, 100`}
                        className="transition-all duration-1500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-black dark:text-white">
                        {progress.overallProgress}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Complete
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-3xl p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">+2 this week</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-black dark:text-white tracking-tight">
                      {progress.completedSessions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Sessions Completed
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 rounded-3xl p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-black dark:text-white tracking-tight">
                      {progress.currentGoals.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Current Goals
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 rounded-3xl p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium text-purple-600">Recent</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-black dark:text-white tracking-tight">
                      {progress.recentAchievements.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Achievements
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LAC-Style Insights Section */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                    {clientInfo.therapistName ? <MessageSquare className="h-6 w-6 text-blue-600" /> : <Brain className="h-6 w-6 text-purple-600" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black dark:text-white tracking-tight">
                      {clientInfo.therapistName ? 'Shared Insights' : 'Self-Reflection Journal'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {clientInfo.therapistName ? 
                        'Updates and insights shared by your therapist' :
                        'Your personal insights, patterns, and growth moments'
                      }
                    </p>
                  </div>
                </div>
                {!clientInfo.therapistName && (
                  <Button 
                    onClick={() => setShowSelfReflection(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-2xl px-6 py-3 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reflection
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {sharedInsights.map((insight) => (
                  <div key={insight.id} className="bg-white/70 dark:bg-gray-800/70 rounded-2xl p-6 border border-white/20 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center">
                          {getInsightIcon(insight.type)}
                        </div>
                        <h4 className="font-semibold text-black dark:text-white text-lg">{insight.title}</h4>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getInsightColor(insight.type)}`}>
                        {insight.type}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{insight.content}</p>
                    {insight.therapistNote && (
                      <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3 mb-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                          <strong>Therapist Note:</strong> {insight.therapistNote}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {clientInfo.therapistName ? 'Shared' : 'Reflected'} {insight.sharedAt.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* LAC-Style Next Session or Spaced Repetition */}
            {clientInfo.therapistName ? (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">Next Session</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Upcoming appointment</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-black dark:text-white">
                    {progress.nextAppointment.toLocaleDateString()}
                  </div>
                  <div className="text-base text-gray-600 dark:text-gray-400 font-medium">
                    {progress.nextAppointment.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <Button className="w-full mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">
                    <Bell className="h-4 w-4 mr-2" />
                    Set Reminder
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">Spaced Repetition</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Build long-term memory</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">insights ready for review</div>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl font-medium py-3"
                    onClick={() => setShowSpacedRepetition(true)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Start Review
                  </Button>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Next review: Tomorrow at 9:00 AM
                  </div>
                </div>
              </div>
            )}

            {/* LAC-Style Current Goals */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">Current Goals</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active objectives</p>
                </div>
              </div>
              <div className="space-y-3">
                {progress.currentGoals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/20">
                    <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LAC-Style Recent Achievements */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">Achievements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Recent milestones</p>
                </div>
              </div>
              <div className="space-y-3">
                {progress.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/20">
                    <Award className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LAC-Style Invite Therapist CTA */}
            {!clientInfo.therapistName && (
              <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-900/30 dark:to-green-900/30 backdrop-blur-xl rounded-3xl p-6 border border-emerald-200/30 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">Ready for Professional Support?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Connect with a licensed therapist</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    You've built a solid foundation with self-reflection. Consider inviting a therapist to:
                  </p>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4">
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span>Share your insights and progress</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span>Get professional guidance</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span>Accelerate your growth</span>
                      </li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-2xl font-medium py-3"
                    onClick={() => setInviteTherapistOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite a Therapist
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}