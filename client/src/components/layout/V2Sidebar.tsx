import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Inbox,
  TrendingUp,
  Users,
  Brain,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  CheckCircle,
  Sparkles
} from "lucide-react";

export function V2Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { 
      href: "/v2/log", 
      label: "Log", 
      icon: Inbox,
      description: "Record sessions & hours",
      completed: true // Example completion status
    },
    { 
      href: "/v2/journey", 
      label: "My Journey", 
      icon: TrendingUp,
      description: "Timeline & reflections",
      completed: false
    },
    { 
      href: "/v2/supervision", 
      label: "Supervision", 
      icon: Users,
      description: "Track supervision hours",
      completed: false
    },
    { 
      href: "/v2/growth", 
      label: "Growth", 
      icon: Brain,
      description: "AI insights & competencies",
      completed: false
    },
    { 
      href: "/v2/rhythm", 
      label: "Rhythm", 
      icon: Clock,
      description: "Weekly insights & nudges",
      completed: false
    },
  ];

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-black">ClarityLog</h2>
            <p className="text-sm text-gray-600">v2.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-black'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isActive ? 'bg-white/20' : 'bg-gray-200 group-hover:bg-gray-300'
                }`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.label}</span>
                    {item.completed && (
                      <CheckCircle className={`h-4 w-4 ${
                        isActive ? 'text-white' : 'text-green-600'
                      }`} />
                    )}
                  </div>
                  <p className={`text-xs ${
                    isActive ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </a>
            </Link>
          );
        })}
      </div>

      <Separator />

      {/* Settings & Help */}
      <div className="p-4 space-y-2">
        <Link href="/settings">
          <a
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 text-gray-700 hover:text-black transition-all"
          >
            <Settings className="h-4 w-4" />
            <span className="font-medium text-sm">Settings</span>
          </a>
        </Link>
        
        <Link href="/help">
          <a
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 text-gray-700 hover:text-black transition-all"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Help</span>
          </a>
        </Link>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 p-3 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-700"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium text-sm">Log Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 lg:border-r lg:bg-white">
        <NavContent />
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
}