import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Phone, Plus, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAccountType } from "@/hooks/use-account-type";
import { useLogEntries } from "@/hooks/use-firestore";
import { useQueryClient } from "@tanstack/react-query";
import { createLogEntry } from "@/lib/firestore";

interface QuickLogTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  data: {
    clientContactHours?: number;
    supervisionHours?: number;
    supervisionType?: string;
    notes: string;
  };
}

export const QuickLogWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupervisor } = useAccountType();
  const { entries, refetch } = useLogEntries();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

  // Analyze user patterns to create intelligent templates
  const analyzeUserPatterns = () => {
    if (!entries || entries.length === 0) {
      return {
        mostCommonDuration: 1.0,
        mostCommonSessionType: 'individual',
        todaysSessionCount: 0,
        todaysHours: 0
      };
    }

    // Get today's sessions
    const today = new Date().toDateString();
    const todaysSessions = entries.filter(entry => 
      new Date(entry.dateOfContact).toDateString() === today
    );

    // Find most common session duration
    const durations = entries.map(entry => entry.clientContactHours).filter(Boolean);
    const durationCounts = durations.reduce((acc, duration) => {
      acc[duration] = (acc[duration] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const mostCommonDuration = Object.entries(durationCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '1.0';

    return {
      mostCommonDuration: parseFloat(mostCommonDuration),
      mostCommonSessionType: 'individual',
      todaysSessionCount: todaysSessions.length,
      todaysHours: todaysSessions.reduce((sum, entry) => sum + entry.clientContactHours, 0)
    };
  };

  const patterns = analyzeUserPatterns();

  const templates: QuickLogTemplate[] = isSupervisor ? [
    {
      id: 'supervision-1h',
      name: '1h Supervision',
      icon: <Users className="w-4 h-4" />,
      data: {
        supervisionHours: 1,
        supervisionType: 'individual',
        notes: 'Individual supervision session completed.'
      }
    },
    {
      id: 'group-supervision',
      name: 'Group Supervision',
      icon: <Users className="w-4 h-4" />,
      data: {
        supervisionHours: 1.5,
        supervisionType: 'group',
        notes: 'Group supervision session completed.'
      }
    }
  ] : [
    // 60-minute direct session
    {
      id: 'direct-60',
      name: '60min Direct',
      icon: <Clock className="w-4 h-4" />,
      data: {
        clientContactHours: 1.0,
        indirectHours: false,
        notes: 'Direct individual therapy session completed.'
      }
    },
    // 60-minute indirect session
    {
      id: 'indirect-60',
      name: '60min Indirect',
      icon: <FileText className="w-4 h-4" />,
      data: {
        clientContactHours: 1.0,
        indirectHours: true,
        notes: 'Indirect services (case notes, treatment planning, etc.) completed.'
      }
    },
    // 90-minute group session
    {
      id: 'group-90',
      name: '90min Group',
      icon: <Users className="w-4 h-4" />,
      data: {
        clientContactHours: 1.5,
        indirectHours: false,
        notes: 'Group therapy session completed.'
      }
    },
    // 60-minute telehealth session
    {
      id: 'telehealth-60',
      name: '60min Telehealth',
      icon: <Phone className="w-4 h-4" />,
      data: {
        clientContactHours: 1.0,
        indirectHours: false,
        notes: 'Telehealth session completed.'
      }
    },
    // User's most common duration (if different from standard options)
    ...(patterns.mostCommonDuration !== 1.0 && patterns.mostCommonDuration !== 1.5 && patterns.todaysSessionCount > 2 ? [{
      id: 'common-duration',
      name: `${Math.round(patterns.mostCommonDuration * 60)}min Pattern`,
      icon: <TrendingUp className="w-4 h-4" />,
      data: {
        clientContactHours: patterns.mostCommonDuration,
        indirectHours: false,
        notes: 'Session logged based on your common pattern.'
      }
    }] : [])
  ].slice(0, 4); // Limit to 4 most relevant options

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

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragX > 50) {
      setIsExpanded(true);
    }
    setDragX(0);
  };

  const handleQuickLog = async (template: QuickLogTemplate) => {
    if (!user?.uid) {
      toast({
        title: "Authentication required",
        description: "Please sign in to log sessions.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create entry data compatible with Firebase schema
      const entryData = {
        dateOfContact: new Date(),
        clientContactHours: template.data.clientContactHours || 0,
        supervisionHours: template.data.supervisionHours || 0,
        indirectHours: template.data.indirectHours || false,
        supervisionType: template.data.supervisionType || 'none',
        techAssistedSupervision: false,
        notes: template.data.notes,
      };

      // Save to Firebase to maintain data consistency
      await createLogEntry(user.uid, entryData);
      
      // Refresh Firebase data
      await refetch();

      const hours = template.data.clientContactHours || template.data.supervisionHours || 0;
      toast({
        title: "Entry logged!",
        description: `${hours}h session saved successfully.`,
      });
      setIsExpanded(false);

    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error saving entry",
        description: "Please try again or use the full form.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative">
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{ touchAction: 'none' }}
      >
        <Button 
          className={`
            bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg
            transition-all duration-200 ease-out
            ${isDragging ? 'scale-105' : ''}
          `}
          style={{ transform: `translateX(${dragX}px)` }}
          onClick={() => !isDragging && (window.location.href = '/add-entry')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Session
        </Button>
        
        {dragX > 20 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/70 pointer-events-none">
            →
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-transparent z-40"
              onClick={() => setIsExpanded(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-600/50 z-50 w-72"
            >
              <div className="mb-2">
                <h3 className="font-bold text-black dark:text-white text-sm">Quick Log</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-1.5">
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickLog(template)}
                    className="p-2.5 bg-white/50 dark:bg-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-600/80 rounded-lg border border-gray-200/60 dark:border-gray-500/60 backdrop-blur-sm transition-all text-left"
                  >
                    <div className="flex items-center space-x-1.5">
                      <div className="text-blue-600 dark:text-blue-400 text-sm">
                        {template.icon}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-black dark:text-white block">
                          {template.name}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {template.data.clientContactHours && `${template.data.clientContactHours}h`}
                          {template.data.supervisionHours && `${template.data.supervisionHours}h`}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-500/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    window.location.href = '/add-entry';
                  }}
                  className="w-full text-xs py-1.5 bg-white/30 dark:bg-gray-700/30 border-gray-200/60 dark:border-gray-500/60"
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