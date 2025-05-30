
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const EnhancedProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "#3b82f6",
  backgroundColor = "#e5e7eb",
  showPercentage = true,
  animated = true,
  children,
  className
}: ProgressRingProps) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setCurrentProgress(progress), 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentProgress(progress);
    }
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (currentProgress / 100) * circumference;

  // Color transitions based on progress
  const getProgressColor = (prog: number) => {
    if (prog >= 90) return "#10b981"; // green
    if (prog >= 70) return "#3b82f6"; // blue
    if (prog >= 40) return "#f59e0b"; // yellow
    return "#ef4444"; // red for low progress
  };

  const progressColor = getProgressColor(currentProgress);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ 
            duration: animated ? 1.5 : 0,
            ease: "easeOut"
          }}
          className="filter drop-shadow-sm"
        />
        
        {/* Glow effect for high progress */}
        {currentProgress >= 70 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth / 2}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="opacity-40 blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1 }}
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <div className="text-center">
            <motion.div
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(currentProgress)}%
            </motion.div>
          </div>
        ))}
      </div>
      
      {/* Celebration particles for 100% */}
      {currentProgress >= 100 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: 3 }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: Math.cos(i * Math.PI / 4) * 40,
                y: Math.sin(i * Math.PI / 4) * 40,
                opacity: [1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
