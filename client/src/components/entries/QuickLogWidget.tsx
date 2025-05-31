import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Phone, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAccountType } from "@/hooks/use-account-type";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);

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
    {
      id: 'individual-90',
      name: '90min Individual',
      icon: <Clock className="w-4 h-4" />,
      data: {
        clientContactHours: 1.5,
        notes: 'Individual therapy session completed.'
      }
    },
    {
      id: 'group-session',
      name: 'Group Session',
      icon: <Users className="w-4 h-4" />,
      data: {
        clientContactHours: 1.5,
        notes: 'Group therapy session completed.'
      }
    },
    {
      id: 'phone-session',
      name: 'Phone Session',
      icon: <Phone className="w-4 h-4" />,
      data: {
        clientContactHours: 1,
        notes: 'Telehealth session completed.'
      }
    }
  ];

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
    try {
      const response = await fetch('/api/log-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template.data,
          userId: user?.uid,
          dateOfContact: new Date(),
          indirectHours: false,
          supervisionType: template.data.supervisionType || 'none',
          techAssistedSupervision: false
        }),
      });

      if (response.ok) {
        toast({
          title: "Entry logged!",
          description: "Your session has been quickly saved.",
        });
        setIsExpanded(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
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