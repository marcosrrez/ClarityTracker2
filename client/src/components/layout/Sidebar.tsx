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
  Mic,
  Activity,
} from "lucide-react";

const getNavigationItems = (accountType: string, permissions: any) => {
  // Primary navigation - core LAC functionality
  const primaryItems = [
    { href: "/dashboard", label: "Dashboard", icon: ChartLine, group: "primary" },
    { href: "/add-entry", label: "Add Entry", icon: Plus, group: "primary" },
    { href: "/client-portal", label: "Client Portal", icon: MessageSquare, group: "primary" },
    { href: "/insights", label: "Insights & Resources", icon: Lightbulb, group: "primary" },
  ];

  // Professional development items
  const professionalItems = [
    { href: "/supervisors", label: "Supervisors", icon: Users, group: "secondary" },
    { href: "/session-recording", label: "Session Recording", icon: Mic, group: "secondary" },
    { href: "/session-intelligence", label: "Session Intelligence", icon: Brain, group: "secondary" },
    { href: "/research-library", label: "Research Library", icon: BookOpen, group: "secondary" },
  ];

  // Therapist-specific items (only show for appropriate account types)
  const therapistItems = [
    { href: "/client-portal", label: "Client Management", icon: MessageSquare, group: "secondary" },
  ];

  // Secondary items - less frequently used
  const secondaryItems = [
    { href: "/requirements", label: "Requirements", icon: ClipboardList, group: "secondary" },
  ];

  const supervisorItems = [
    { href: "/supervisees", label: "Supervisees", icon: Users, group: "secondary" },
    { href: "/supervisor-analytics", label: "Analytics Dashboard", icon: BarChart3, group: "secondary" },
    { href: "/compliance", label: "Compliance", icon: Shield, group: "secondary" },
    { href: "/reports", label: "Reports", icon: FileText, group: "secondary" },
  ];

  const enterpriseItems = [
    { href: "/organization", label: "Organization", icon: Building2, group: "secondary" },
    { href: "/user-management", label: "User Management", icon: Users, group: "secondary" },
  ];

  const settingsItems = [
    { href: "/settings", label: "Settings", icon: Settings, group: "settings" },
    { href: "/feedback", label: "Feedback", icon: MessageSquare, group: "settings" },
    { href: "/help", label: "Help", icon: HelpCircle, group: "settings" },
  ];

  // Combine all secondary items based on account type
  const allSecondaryItems = [
    ...professionalItems,
    ...secondaryItems,
    ...(permissions?.supervisor ? supervisorItems : []),
    ...(accountType === 'enterprise' ? enterpriseItems : []),
    ...(accountType === 'supervisor' || permissions?.therapist ? therapistItems : []),
    ...settingsItems,
  ];

  // Return primary items first, then all secondary items
  return [...primaryItems, ...allSecondaryItems];
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
      <SheetContent side="right" className="w-80 p-0 rounded-2xl">
        <SheetHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
          <SheetTitle className="flex items-center space-x-3">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">ClarityLog</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 p-6 flex flex-col">
          {/* Primary navigation - top 6 items with tight spacing */}
          <div className="space-y-1">
            {navigationItems.filter(item => item.group === 'primary').map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => onOpenChange(false)}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Spacer to push secondary items to bottom */}
          <div className="flex-1" />
          
          {/* Secondary navigation - all other items at bottom with border separator */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              {navigationItems.filter(item => item.group === 'secondary' || item.group === 'settings').map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => onOpenChange(false)}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Clean footer section - Routine inspired */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl h-10"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span>Download Data</span>
          </Button>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl h-10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
