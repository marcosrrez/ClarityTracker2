import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomQuote, type CounselingQuote } from '@/lib/counseling-quotes';
import { Loader2 } from 'lucide-react';

interface LoadingQuoteProps {
  context?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
  showSpinner?: boolean;
  message?: string;
}

export function LoadingQuote({ 
  context, 
  skillLevel, 
  className = '',
  showSpinner = true,
  message = "Processing..."
}: LoadingQuoteProps) {
  const [quote, setQuote] = useState<CounselingQuote | null>(null);

  useEffect(() => {
    // Get a random quote based on context
    const selectedQuote = getRandomQuote(context, skillLevel);
    setQuote(selectedQuote);
  }, [context, skillLevel]);

  if (!quote) return null;

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] p-8 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={quote.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-2xl"
        >
          {showSpinner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
            </motion.div>
          )}

          <motion.blockquote
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-200 mb-4 leading-relaxed italic"
          >
            "{quote.quote}"
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-2"
          >
            <cite className="text-base font-semibold text-gray-700 dark:text-gray-300 not-italic">
              — {quote.author}
            </cite>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {quote.theory}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-4 flex flex-wrap justify-center gap-2"
          >
            {quote.context.slice(0, 3).map((ctx) => (
              <span
                key={ctx}
                className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
              >
                {ctx}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Compact version for smaller loading states
export function LoadingQuoteCompact({ 
  context, 
  skillLevel, 
  className = ''
}: Omit<LoadingQuoteProps, 'showSpinner' | 'message'>) {
  const [quote, setQuote] = useState<CounselingQuote | null>(null);

  useEffect(() => {
    const selectedQuote = getRandomQuote(context, skillLevel);
    setQuote(selectedQuote);
  }, [context, skillLevel]);

  if (!quote) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500 mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic mb-2 leading-relaxed">
            "{quote.quote}"
          </blockquote>
          <cite className="text-xs text-gray-600 dark:text-gray-400 not-italic">
            — {quote.author}, {quote.theory}
          </cite>
        </div>
      </div>
    </motion.div>
  );
}