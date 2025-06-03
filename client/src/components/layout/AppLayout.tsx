import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="ive-glass sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 flex-shrink-0">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center space-x-3 cursor-pointer ive-hover-lift transition-all duration-200" onClick={() => window.location.href = '/dashboard'}>
            <Sprout className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground tracking-tight">ClarityLog</h1>
          </div>
          <div className="flex items-center space-x-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFocusMode(true)}
                    className="ive-button text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter Focus Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <NotificationBadge />

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

      {/* Main content area */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Footer pushed to bottom */}
      <footer className="flex-shrink-0 py-6 border-t bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center text-xs text-muted-foreground">
            © 2024 ClarityLog. Professional development platform for Licensed Associate Counselors.
          </div>
        </div>
      </footer>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </div>
  );
};
