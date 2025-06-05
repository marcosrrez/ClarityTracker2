import React, { useState } from 'react';
import { ClientNavigation } from './ClientNavigation';
import { ReflectionJournal } from './ReflectionJournal';
import { GrowthResources } from './GrowthResources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Calendar, MessageSquare, TrendingUp, Bell, FileText, Target, Award, Plus, UserPlus, Sparkles, Brain, Clock, Share2 } from 'lucide-react';

interface ClientInfo {
  name: string;
  therapistName?: string;
  memberSince: string;
  sessionCount: number;
  weekStreak: number;
}

interface ClientProgress {
  overallProgress: number;
  currentGoals: string[];
  completedSessions: number;
  nextAppointment: Date;
  recentAchievements: string[];
}

interface ClientPortalProps {
  clientId: string;
}

export function ClientPortal({ clientId }: ClientPortalProps) {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'journal' | 'growth'>('dashboard');
  const [inviteTherapistOpen, setInviteTherapistOpen] = useState(false);

  // Mock client data - would come from API
  const clientInfo: ClientInfo = {
    name: "Sarah Johnson",
    therapistName: undefined, // No therapist connected yet
    memberSince: "March 2024",
    sessionCount: 8,
    weekStreak: 2
  };

  const progress: ClientProgress = {
    overallProgress: 73,
    currentGoals: [
      "Reduce anxiety in social situations",
      "Improve sleep quality", 
      "Practice daily mindfulness"
    ],
    completedSessions: 12,
    nextAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    recentAchievements: [
      "Completed breathing exercise for 7 consecutive days",
      "Successfully used coping strategies during stressful meeting",
      "Reached out to friend when feeling overwhelmed"
    ]
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const unreadInsights = 2; // Mock unread supervisor insights

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card - Exact LAC Style */}
        <div className="mb-8">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">
                      {getGreeting()}, {clientInfo.name.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
                      You're building momentum! Each reflection gets you closer to self-discovery and growth.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-blue-200 dark:border-blue-800 flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {clientInfo.sessionCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          reflections
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-blue-500"
                          strokeDasharray={`${(progress.overallProgress / 100) * 226} 226`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-medium">
                    Strong week
                  </Badge>
                </div>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reflection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-black dark:text-white flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Building self-awareness through reflection and growth
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {progress.overallProgress}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Complete
                  </div>
                  <Progress value={progress.overallProgress} className="h-3 bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-black dark:text-white flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {progress.recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-white/20">
                    <Award className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{achievement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Benefits of working with a therapist:</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Personalized insights and feedback on your reflections</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Professional guidance tailored to your goals</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>Evidence-based strategies for your specific challenges</span>
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
        )}
      </div>
    </div>
  );

  return (
    <div>
      <ClientNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        therapistConnected={!!clientInfo.therapistName}
        therapistName={clientInfo.therapistName}
        unreadInsights={unreadInsights}
      />
      
      {currentTab === 'dashboard' && renderDashboard()}
      {currentTab === 'journal' && (
        <ReflectionJournal 
          clientId={clientId} 
          supervisorConnected={!!clientInfo.therapistName}
        />
      )}
      {currentTab === 'growth' && (
        <GrowthResources 
          clientId={clientId} 
          therapistConnected={!!clientInfo.therapistName}
        />
      )}
    </div>
  );
}