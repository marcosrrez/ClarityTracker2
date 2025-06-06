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
  // Primary navigation - core daily workflow items
  const primaryItems = [
    { href: "/dashboard", label: "Dashboard", icon: ChartLine, group: "primary" },
    { href: "/add-entry", label: "Add Entry", icon: Plus, group: "primary" },
    { href: "/client-portal", label: "Client Portal", icon: MessageSquare, group: "primary" },
    { href: "/insights", label: "Insights & Resources", icon: Lightbulb, group: "primary" },
  ];

  // Professional development section - grouped together
  const professionalItems = [
    { href: "/supervisors", label: "Supervisors", icon: Users, group: "professional" },
    { href: "/session-recording", label: "Session Recording", icon: Mic, group: "professional" },
    { href: "/session-intelligence", label: "Session Intelligence", icon: Brain, group: "professional" },
    { href: "/research-library", label: "Research Library", icon: BookOpen, group: "professional" },
    { href: "/requirements", label: "Requirements", icon: ClipboardList, group: "professional" },
  ];

  // Supervisor-specific functionality
  const supervisorItems = [
    { href: "/supervisees", label: "Supervisees", icon: Users, group: "supervisor" },
    { href: "/supervisor-analytics", label: "Analytics Dashboard", icon: BarChart3, group: "supervisor" },
    { href: "/compliance", label: "Compliance", icon: Shield, group: "supervisor" },
    { href: "/reports", label: "Reports", icon: FileText, group: "supervisor" },
  ];

  // Enterprise administration
  const enterpriseItems = [
    { href: "/organization", label: "Organization", icon: Building2, group: "enterprise" },
    { href: "/user-management", label: "User Management", icon: Users, group: "enterprise" },
  ];

  // User utilities - grouped with download data for better flow
  const utilityItems = [
    { href: "/settings", label: "Settings", icon: Settings, group: "utility" },
    { href: "/feedback", label: "Feedback", icon: MessageSquare, group: "utility" },
    { href: "/help", label: "Help", icon: HelpCircle, group: "utility" },
  ];

  // Combine sections based on account type
  const allItems = [
    ...primaryItems,
    ...professionalItems,
    ...(permissions?.supervisor ? supervisorItems : []),
    ...(accountType === 'enterprise' ? enterpriseItems : []),
    ...utilityItems,
  ];

  return allItems;
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
          {/* Primary navigation - core daily workflow */}
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

          {/* Professional Development section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
              Professional Development
            </h4>
            <div className="space-y-1">
              {navigationItems.filter(item => item.group === 'professional').map((item) => {
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

          {/* Supervisor section (if applicable) */}
          {navigationItems.some(item => item.group === 'supervisor') && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                Supervision
              </h4>
              <div className="space-y-1">
                {navigationItems.filter(item => item.group === 'supervisor').map((item) => {
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
          )}

          {/* Enterprise section (if applicable) */}
          {navigationItems.some(item => item.group === 'enterprise') && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                Administration
              </h4>
              <div className="space-y-1">
                {navigationItems.filter(item => item.group === 'enterprise').map((item) => {
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
          )}

          {/* Spacer to push utilities to bottom */}
          <div className="flex-1" />
        </nav>

        {/* User utilities section - grouped together for better UX */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
            Account & Support
          </h4>
          
          <div className="space-y-1">
            {/* User utility navigation items */}
            {navigationItems.filter(item => item.group === 'utility').map((item) => {
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

            {/* Download Data button grouped with utilities */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-sm font-medium"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
              <span className="truncate">Download Data</span>
            </Button>
          </div>

          {/* Logout section - separated for emphasis */}
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl text-sm font-medium"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
