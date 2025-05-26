import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Sprout, Menu, Eye, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const { theme, toggleTheme } = useTheme();

  if (focusMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-8">
          <div className="bg-card rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sprout className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">Focus Mode</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFocusMode(false)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Exit Focus
              </Button>
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Rams polish: Refined version of your original header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center space-x-3">
            <Sprout className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground tracking-tight">ClarityLog</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(true)}
              className="ive-button text-muted-foreground hover:text-foreground"
            >
              <Eye className="h-4 w-4 mr-2" />
              Focus
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="ive-button text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Rams polish: Keeping your original proportions with refined spacing */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 ClarityLog. Designed for Licensed Associate Counselors on their path to professional licensure.
          </div>
        </div>
      </footer>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </div>
  );
};
