
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

  // Calculate progress percentage for visual feedback
  const numericValue = parseFloat(value) || 0;
  const progressPercentage = title.includes("Client") ? Math.min((numericValue / 100) * 100, 100) : 
                           title.includes("Supervision") ? Math.min((numericValue / 50) * 100, 100) : 50;
  
  const isPositive = trend === "up";
  const isNegative = trend === "down";
  const showCelebration = isPositive && numericValue > 20;

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
      {/* Dynamic gradient based on progress psychology */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        isPositive ? 'from-green-50/30 via-transparent to-emerald-50/30' :
        isNegative ? 'from-orange-50/30 via-transparent to-amber-50/30' :
        'from-blue-50/30 via-transparent to-indigo-50/30'
      } pointer-events-none transition-colors duration-500`} />
      
      {/* Progress celebration effect */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-green-200/20 to-blue-200/20 animate-pulse pointer-events-none" />
      )}
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header with motivation indicators */}
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className={`p-3 rounded-2xl backdrop-blur-sm transition-colors duration-300 ${
              isPositive ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' :
              isNegative ? 'bg-gradient-to-br from-orange-500/10 to-amber-500/10' :
              'bg-gradient-to-br from-blue-500/10 to-indigo-500/10'
            }`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className={cn("h-5 w-5", 
              isPositive ? 'text-green-600 dark:text-green-400' :
              isNegative ? 'text-orange-600 dark:text-orange-400' :
              iconColor
            )} />
          </motion.div>
          
          <div className="flex items-center space-x-2">
            {subtitle && (
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {subtitle}
              </span>
            )}
            
            {/* Mini progress indicator for at-a-glance motivation */}
            {progressPercentage > 0 && (
              <div className="w-6 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${
                    isPositive ? 'bg-green-500' :
                    isNegative ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Value with momentum indicators */}
        <div className="flex items-baseline justify-between mb-2">
          <motion.h4
            className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.h4>
          
          {/* Achievement badge for positive psychology */}
          {isPositive && numericValue > 0 && (
            <motion.div 
              className="flex items-center text-xs text-green-600 dark:text-green-400 font-semibold"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
              Growing
            </motion.div>
          )}
          
          {showCelebration && (
            <motion.span 
              className="text-lg"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              🎯
            </motion.span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-3">
          {title}
        </p>

        {/* Enhanced change indicator with psychology */}
        {(change !== undefined || changeLabel) && (
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-1">
              {change !== undefined && (
                <>
                  {getTrendIcon()}
                  <span className={cn("text-sm font-medium", getTrendColor())}>
                    {isPositive && "↗ "}
                    {change > 0 ? '+' : ''}{change}
                  </span>
                </>
              )}
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
            
            {/* Streak indicator for momentum */}
            {isPositive && change && change > 0 && (
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Keep going!
              </div>
            )}
          </motion.div>
        )}

        {/* Full-width progress bar for completion psychology */}
        {progressPercentage > 0 && (
          <motion.div 
            className="mt-4 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div 
              className={`h-full rounded-full ${
                isPositive ? 'bg-gradient-to-r from-green-400 to-green-600' :
                isNegative ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
              transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        )}

        {/* Interactive progress indicator */}
        {onClick && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        )}
      </div>
    </motion.div>
  );
};
