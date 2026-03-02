import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WelcomeOverlayProps {
  onStartLogging: () => void;
  onClose: () => void;
}

export const WelcomeOverlay = ({ onStartLogging, onClose }: WelcomeOverlayProps) => {
  const { userProfile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center"
      >
        <div className="w-full max-w-md mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-12"
          >
            {/* Greeting */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                {getGreeting()}, {userProfile?.preferredName || 'there'}
              </h1>
              <p className="text-xl text-gray-600">
                Ready to log your progress?
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button
                onClick={onStartLogging}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg rounded-xl font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start Logging Session
              </Button>

              <button
                onClick={onClose}
                className="w-full text-gray-500 hover:text-gray-700 py-3 text-base transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};