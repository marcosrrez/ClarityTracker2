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
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import {
  ChartLine,
  Plus,
  Lightbulb,
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
} from "lucide-react";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartLine },
  { href: "/add-entry", label: "Add Entry", icon: Plus },
  { href: "/insights", label: "Insights & Resources", icon: Lightbulb },
  { href: "/summary", label: "Summary", icon: BarChart3 },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/ai-analysis", label: "AI Analysis", icon: Bot },
  { href: "/requirements", label: "Requirements", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: HelpCircle },
];

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

        <nav className="flex-1 p-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start space-x-3 ${
                    isActive 
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
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
