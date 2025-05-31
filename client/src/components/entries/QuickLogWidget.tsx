import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Users, Phone, FileText, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAccountType } from "@/hooks/use-account-type";
import type { InsertLogEntry, LogEntry } from "@shared/schema";

interface QuickLogTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  data: Partial<InsertLogEntry>;
  frequency: number;
}

interface QuickLogWidgetProps {
  onQuickLog?: () => void;
}

export const QuickLogWidget = ({ onQuickLog }: QuickLogWidgetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupervisor } = useAccountType();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  // Fetch recent entries to build smart templates
  const { data: recentEntries = [] } = useQuery({
    queryKey: ['/api/log-entries', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/log-entries?userId=${user?.uid}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      return response.json();
    },
    enabled: !!user?.uid
  });

  // Quick log mutation
  const quickLogMutation = useMutation({
    mutationFn: async (data: Partial<InsertLogEntry>) => {
      const response = await fetch('/api/log-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: user?.uid,
          dateOfContact: new Date(),
        }),
      });
      if (!response.ok) throw new Error('Failed to create entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/log-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      toast({
        title: "Entry logged!",
        description: "Your session has been quickly saved.",
      });
      setIsExpanded(false);
      onQuickLog?.();
    },
    onError: () => {
      toast({
        title: "Error saving entry",
        description: "Please try again or use the full form.",
        variant: "destructive",
      });
    }
  });

  // Generate smart templates based on user patterns
  const generateTemplates = (): QuickLogTemplate[] => {
    const baseTemplates: QuickLogTemplate[] = [];

    if (isSupervisor) {
      baseTemplates.push(
        {
          id: 'supervision-1h',
          name: '1h Supervision',
          icon: <Users className="w-4 h-4" />,
          data: {
            clientContactHours: 0,
            supervisionHours: 1,
            supervisionType: 'individual',
            notes: 'Supervision session completed.'
          },
          frequency: 5
        },
        {
          id: 'group-supervision',
          name: 'Group Supervision',
          icon: <Users className="w-4 h-4" />,
          data: {
            clientContactHours: 0,
            supervisionHours: 1.5,
            supervisionType: 'group',
            notes: 'Group supervision session completed.'
          },
          frequency: 3
        }
      );
    } else {
      baseTemplates.push(
        {
          id: 'individual-90',
          name: '90min Individual',
          icon: <Clock className="w-4 h-4" />,
          data: {
            clientContactHours: 1.5,
            indirectHours: false,
            notes: 'Individual therapy session completed.'
          },
          frequency: 8
        },
        {
          id: 'group-session',
          name: 'Group Session',
          icon: <Users className="w-4 h-4" />,
          data: {
            clientContactHours: 1.5,
            indirectHours: false,
            notes: 'Group therapy session completed.'
          },
          frequency: 4
        },
        {
          id: 'phone-session',
          name: 'Phone Session',
          icon: <Phone className="w-4 h-4" />,
          data: {
            clientContactHours: 1,
            indirectHours: false,
            notes: 'Telehealth session completed.'
          },
          frequency: 3
        }
      );
    }

    return baseTemplates
      .filter(template => template.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 4);
  };

  const templates = generateTemplates();

  const handleDragStart = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDragX(Math.max(0, Math.min(x - 20, 100)));
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragX > 50) {
      setIsExpanded(true);
    }
    setDragX(0);
  };

  const handleQuickLog = (template: QuickLogTemplate) => {
    quickLogMutation.mutate(template.data);
  };

  const shouldShowHint = recentEntries.length >= 5 && templates.length > 0 && !localStorage.getItem('quickLogDiscovered');

  useEffect(() => {
    if (isExpanded) {
      localStorage.setItem('quickLogDiscovered', 'true');
    }
  }, [isExpanded]);

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden rounded-xl"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{ touchAction: 'none' }}
      >
        <Button 
          className={`
            relative bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg
            transition-all duration-200 ease-out
            ${isDragging ? 'scale-105' : ''}
          `}
          style={{ transform: `translateX(${dragX}px)` }}
          onClick={() => !isDragging && window.location.href = '/add-entry'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Session
        </Button>
        
        {shouldShowHint && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute -right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none"
          >
            →
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsExpanded(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              className="absolute top-full left-0 mt-2 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 min-w-80"
            >
              <div className="mb-3">
                <h3 className="font-bold text-black dark:text-white text-sm">Quick Log</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on your recent patterns</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickLog(template)}
                    disabled={quickLogMutation.isPending}
                    className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="text-blue-600 dark:text-blue-400">
                        {template.icon}
                      </div>
                      <span className="text-sm font-medium text-black dark:text-white">
                        {template.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {template.data.clientContactHours && `${template.data.clientContactHours}h client`}
                      {template.data.supervisionHours && `${template.data.supervisionHours}h supervision`}
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {templates.length === 0 && (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Log a few sessions to see quick options here
                  </p>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    window.location.href = '/add-entry';
                  }}
                  className="w-full text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Full Form
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};