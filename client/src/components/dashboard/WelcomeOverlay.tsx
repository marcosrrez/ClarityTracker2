import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sprout, 
  Plus, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Target,
  Clock
} from "lucide-react";

interface WelcomeOverlayProps {
  onStartLogging: () => void;
  onClose: () => void;
}

export const WelcomeOverlay = ({ onStartLogging, onClose }: WelcomeOverlayProps) => {
  const { userProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Every session is a step toward mastery",
      "Your dedication shapes the future of counseling",
      "Progress happens one hour at a time",
      "Small steps lead to great achievements",
      "Your professional growth matters"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white z-50 flex items-center justify-center"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-50 rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-30" />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-8"
          >
            {/* Logo and greeting */}
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto"
              >
                <Sprout className="w-10 h-10 text-white" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {getGreeting()}, {userProfile?.preferredName || 'there'}!
                </h1>
                <p className="text-lg text-gray-600">
                  {formatDate(currentTime)}
                </p>
              </motion.div>
            </div>

            {/* Motivational message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 rounded-2xl p-6"
            >
              <p className="text-xl text-gray-700 font-medium">
                {getMotivationalMessage()}
              </p>
            </motion.div>

            {/* Quick action cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Plus className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Log Session</h3>
                  <p className="text-sm text-gray-600">Add today's client hours</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
                  <p className="text-sm text-gray-600">Review your journey</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-1">Set Goals</h3>
                  <p className="text-sm text-gray-600">Plan your week</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Primary action */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
              className="space-y-4"
            >
              <Button
                onClick={onStartLogging}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Start Logging Session
                <ArrowRight className="w-5 h-5" />
              </Button>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <button
                  onClick={onClose}
                  className="hover:text-gray-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};