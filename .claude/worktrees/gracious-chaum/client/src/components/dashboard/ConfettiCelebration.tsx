import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Target, Award, PartyPopper, X } from "lucide-react";

interface MilestoneData {
  title: string;
  description: string;
  icon: any;
  color: string;
  hours: number;
}

const MILESTONES: MilestoneData[] = [
  {
    title: "First Steps!",
    description: "You've logged your first session. The journey to LPC begins!",
    icon: Target,
    color: "from-green-400 to-green-600",
    hours: 1
  },
  {
    title: "Building Momentum",
    description: "10 hours logged! You're establishing great tracking habits.",
    icon: Star,
    color: "from-blue-400 to-blue-600",
    hours: 10
  },
  {
    title: "Quarter Mark",
    description: "1000 hours completed! You're 25% of the way to licensure.",
    icon: Award,
    color: "from-purple-400 to-purple-600",
    hours: 1000
  },
  {
    title: "Halfway There!",
    description: "2000 hours logged! The halfway point to your LPC.",
    icon: Trophy,
    color: "from-orange-400 to-orange-600",
    hours: 2000
  },
  {
    title: "Almost Ready!",
    description: "3000 hours completed! You're in the final stretch.",
    icon: PartyPopper,
    color: "from-pink-400 to-pink-600",
    hours: 3000
  },
  {
    title: "LPC Ready!",
    description: "4000 hours achieved! You're ready for licensure!",
    icon: Trophy,
    color: "from-yellow-400 to-yellow-600",
    hours: 4000
  }
];

interface ConfettiCelebrationProps {
  totalHours: number;
  onDismiss: () => void;
}

export const ConfettiCelebration = ({ totalHours, onDismiss }: ConfettiCelebrationProps) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneData | null>(null);

  useEffect(() => {
    checkForMilestone();
  }, [totalHours]);

  const checkForMilestone = () => {
    const achievedMilestone = MILESTONES.find(milestone => 
      totalHours >= milestone.hours && 
      !localStorage.getItem(`milestone_${milestone.hours}_celebrated`)
    );

    if (achievedMilestone) {
      setCurrentMilestone(achievedMilestone);
      setShowCelebration(true);
      localStorage.setItem(`milestone_${achievedMilestone.hours}_celebrated`, 'true');
    }
  };

  const handleDismiss = () => {
    setShowCelebration(false);
    setTimeout(() => {
      setCurrentMilestone(null);
      onDismiss();
    }, 300);
  };

  if (!currentMilestone) return null;

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  y: -100,
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                }}
                animate={{
                  opacity: 0,
                  y: window.innerHeight + 100,
                  rotate: 360,
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 2,
                  ease: "easeOut",
                }}
                className={`absolute w-2 h-2 rounded-full ${
                  i % 4 === 0 ? 'bg-yellow-400' :
                  i % 4 === 1 ? 'bg-blue-400' :
                  i % 4 === 2 ? 'bg-green-400' : 'bg-pink-400'
                }`}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative"
          >
            <Card className="max-w-md w-full mx-4 bg-white shadow-2xl border-0">
              <CardContent className="p-8 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="mb-6"
                >
                  <div className={`w-20 h-20 bg-gradient-to-r ${currentMilestone.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <currentMilestone.icon className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentMilestone.title}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {currentMilestone.description}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{totalHours}</span> hours logged
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((totalHours / 4000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleDismiss}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Continue Your Journey
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};