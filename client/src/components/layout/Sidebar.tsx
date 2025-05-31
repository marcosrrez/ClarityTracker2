import { Link, useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  ChartLine,
  Plus,
  Lightbulb,
  Brain,
  BookOpen,
  BarChart3,
  Images,
  Bot,
  ClipboardList,
  Settings,
  HelpCircle,
  Download,
  Moon,
  Sun,
  LogOut,
  Sprout,
  MessageSquare,
  Users,
  Building2,
  Shield,
  FileText,
} from "lucide-react";

const getNavigationItems = (accountType: string, permissions: any) => {
  const baseItems = [
    { href: "/dashboard", label: "Dashboard", icon: ChartLine },
    { href: "/add-entry", label: "Add Entry", icon: Plus },
  ];

  const individualItems = [
    { href: "/insights", label: "Insights & Resources", icon: Lightbulb },
    { href: "/ai-insights", label: "AI Insights", icon: Brain },
    { href: "/spaced-repetition", label: "Spaced Repetition", icon: BookOpen },
    { href: "/summary", label: "Summary", icon: BarChart3 },
    { href: "/gallery", label: "Gallery", icon: Images },
    { href: "/ai-analysis", label: "AI Analysis", icon: Bot },
    { href: "/requirements", label: "Requirements", icon: ClipboardList },
  ];

  const supervisorItems = [
    { href: "/supervisees", label: "Supervisees", icon: Users },
    { href: "/compliance", label: "Compliance", icon: Shield },
    { href: "/reports", label: "Reports", icon: FileText },
    ...individualItems,
  ];

  const enterpriseItems = [
    { href: "/organization", label: "Organization", icon: Building2 },
    { href: "/user-management", label: "User Management", icon: Users },
    ...supervisorItems,
  ];

  const commonItems = [
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/help", label: "Help", icon: HelpCircle },
  ];

  let items = [...baseItems];

  if (accountType === 'enterprise') {
    items = [...items, ...enterpriseItems];
  } else if (accountType === 'supervisor') {
    items = [...items, ...supervisorItems];
  } else {
    items = [...items, ...individualItems];
  }

  return [...items, ...commonItems];
};

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { accountType, permissions } = useAccountType();
  
  const navigationItems = getNavigationItems(accountType, permissions);

  const handleLogout = async () => {
    try {
      await logout();
      onOpenChange(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDownload = () => {
    // TODO: Implement data download functionality
    console.log("Download data");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-3">
              <Sprout className="h-6 w-6 text-primary" />
              <span>ClarityLog</span>
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="ive-button h-8 w-8 rounded-full p-0"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </SheetHeader>

        {/* Notifications Section */}
        <div className="p-6 border-b">
          <NotificationCenter />
        </div>

        <nav className="flex-1 p-6 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start space-x-3 h-12 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/50" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
            <span>Download Data</span>
          </Button>
        </nav>

        <div className="p-6 border-t space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
