
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export const EnhancedStatsCard = ({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "text-blue-500",
  trend = "neutral",
  className,
  onClick,
  isLoading = false
}: EnhancedStatsCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 rounded-3xl p-6 border border-white/20 shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 rounded-3xl p-6 border border-white/20 shadow-lg transition-all duration-500 relative overflow-hidden group",
        onClick && "cursor-pointer hover:shadow-xl hover:scale-105",
        className
      )}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none" />
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl backdrop-blur-sm"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </motion.div>
          
          {subtitle && (
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium px-2 py-1 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg">
              {subtitle}
            </span>
          )}
        </div>

        {/* Main Value */}
        <motion.div
          className="mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {value}
          </h4>
        </motion.div>

        {/* Title */}
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-3">
          {title}
        </p>

        {/* Change Indicator */}
        {(change !== undefined || changeLabel) && (
          <motion.div 
            className="flex items-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {change !== undefined && (
              <>
                {getTrendIcon()}
                <span className={cn("text-sm font-medium", getTrendColor())}>
                  {change > 0 ? '+' : ''}{change}
                </span>
              </>
            )}
            {changeLabel && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                {changeLabel}
              </span>
            )}
          </motion.div>
        )}

        {/* Progress indicator for certain cards */}
        {onClick && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        )}
      </div>
    </motion.div>
  );
};
