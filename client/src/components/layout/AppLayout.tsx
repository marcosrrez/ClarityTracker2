import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Sprout, Menu, Eye } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

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
      {/* Rams: Header becomes invisible until needed */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-8 h-14">
          <div className="flex items-center space-x-2">
            <Sprout className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-medium text-foreground tracking-tight">ClarityLog</h1>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(true)}
              className="text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-sm"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Focus
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-sm"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Rams: Content-first layout with perfect proportions */}
      <main className="px-8 py-12 max-w-5xl mx-auto">
        <div className="space-y-12">
          {children}
        </div>
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
