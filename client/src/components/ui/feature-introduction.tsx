import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Lightbulb, Brain, BookOpen, Sparkles } from 'lucide-react';
import { getRandomQuote } from '@/lib/counseling-quotes';

interface FeatureIntroductionProps {
  onDismiss: () => void;
}

export function FeatureIntroduction({ onDismiss }: FeatureIntroductionProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const sampleQuote = getRandomQuote(['therapeutic alliance'], 'intermediate');

  const features = [
    {
      icon: <Lightbulb className="h-8 w-8 text-amber-500" />,
      title: "Educational Loading Experience",
      description: "While Dinger processes your messages, discover wisdom from renowned counseling theorists like Carl Rogers, Fritz Perls, and Bessel van der Kolk.",
      preview: (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800 p-4">
          <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
            "{sampleQuote.quote}"
          </blockquote>
          <cite className="text-xs text-gray-600 dark:text-gray-400">
            — {sampleQuote.author}, {sampleQuote.theory}
          </cite>
        </div>
      )
    },
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: "Smart Usage Management",
      description: "Enjoy 50 AI-powered conversations daily. When your limit is reached, Dinger seamlessly switches to our comprehensive counseling knowledge base.",
      preview: (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>AI Messages Today</span>
            <span className="font-medium">42 / 50</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '84%' }}></div>
          </div>
          <Badge variant="secondary" className="text-xs">8 messages remaining</Badge>
        </div>
      )
    },
    {
      icon: <BookOpen className="h-8 w-8 text-green-500" />,
      title: "Expert Knowledge Base",
      description: "Access comprehensive LAC and LPC exam knowledge, counseling theories, and professional development guidance even when AI limits are reached.",
      preview: (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Badge variant="outline">Gestalt Therapy</Badge>
          <Badge variant="outline">DBT Skills</Badge>
          <Badge variant="outline">Family Systems</Badge>
          <Badge variant="outline">Trauma-Informed</Badge>
          <Badge variant="outline">Ethics & Law</Badge>
          <Badge variant="outline">Supervision</Badge>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onDismiss();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">What's New in ClarityLog</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                {features[currentStep].icon}
                <h3 className="text-base font-medium">{features[currentStep].title}</h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {features[currentStep].description}
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                {features[currentStep].preview}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-6">
            <div className="flex gap-1">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} size="sm">
                  Previous
                </Button>
              )}
              <Button onClick={handleNext} size="sm">
                {currentStep < features.length - 1 ? 'Next' : 'Get Started'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}