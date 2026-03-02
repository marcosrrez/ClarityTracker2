import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  UserPlus, 
  User,
  Bell
} from 'lucide-react';

interface ClientNavigationProps {
  currentTab: 'dashboard' | 'journal' | 'growth';
  onTabChange: (tab: 'dashboard' | 'journal' | 'growth') => void;
  therapistConnected?: boolean;
  therapistName?: string;
  unreadInsights?: number;
}

export function ClientNavigation({ 
  currentTab, 
  onTabChange, 
  therapistConnected = false, 
  therapistName,
  unreadInsights = 0 
}: ClientNavigationProps) {
  const [, setLocation] = useLocation();

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and progress'
    },
    {
      id: 'journal' as const,
      label: 'Reflection Journal',
      icon: BookOpen,
      description: 'Your thoughts and insights',
      badge: unreadInsights > 0 ? unreadInsights : undefined
    },
    {
      id: 'growth' as const,
      label: 'Growth & Resources',
      icon: TrendingUp,
      description: 'Goals and learning materials'
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ClarityLog
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {tab.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Therapist Connection */}
          <div className="flex items-center space-x-3">
            {therapistConnected && therapistName ? (
              <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200/30">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {therapistName}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Connected
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => {
                  // This would trigger the invite therapist modal
                  // For now, we'll just show a placeholder
                }}
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Invite Therapist</span>
                <span className="sm:hidden">Invite</span>
              </Button>
            )}

            {/* Notifications */}
            {unreadInsights > 0 && (
              <div className="relative">
                <Button size="sm" variant="ghost" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {unreadInsights}
                  </Badge>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab descriptions (mobile) */}
        <div className="pb-2 md:hidden">
          {tabs.map((tab) => {
            if (currentTab === tab.id) {
              return (
                <p key={tab.id} className="text-xs text-gray-500 dark:text-gray-400">
                  {tab.description}
                </p>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}