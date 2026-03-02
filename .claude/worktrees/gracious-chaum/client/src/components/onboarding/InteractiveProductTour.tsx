import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Brain, 
  Users, 
  BarChart3, 
  Clock, 
  Target,
  CheckCircle,
  Play
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  feature: string;
  icon: React.ComponentType<any>;
  demoAction?: string;
  benefits: string[];
  accountTypes: ('individual' | 'supervisor' | 'enterprise')[];
}

interface InteractiveProductTourProps {
  accountType: 'individual' | 'supervisor' | 'enterprise';
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: 'quick-logging',
    title: '30-Second Session Logging',
    description: 'Log sessions faster than writing a text message',
    feature: 'Smart session entry with auto-complete and templates',
    icon: Zap,
    demoAction: 'Try logging a session',
    benefits: [
      'Pre-filled client data and common interventions',
      'Voice-to-text for rapid entry',
      'Smart categorization and hour tracking'
    ],
    accountTypes: ['individual', 'supervisor']
  },
  {
    id: 'ai-insights',
    title: 'AI-Powered Clinical Insights',
    description: 'Discover patterns in your practice that enhance client outcomes',
    feature: 'Advanced pattern recognition and intervention analysis',
    icon: Brain,
    demoAction: 'View sample insights',
    benefits: [
      'Identify your most effective interventions',
      'Track client progress patterns',
      'Receive personalized recommendations'
    ],
    accountTypes: ['individual', 'supervisor', 'enterprise']
  },
  {
    id: 'supervisor-collaboration',
    title: 'Seamless Supervisor Collaboration',
    description: 'Transform supervision from chore to career accelerator',
    feature: 'Real-time progress sharing and feedback integration',
    icon: Users,
    demoAction: 'Set up collaboration',
    benefits: [
      'Automatic progress reports for supervisors',
      'Competency tracking aligned with state requirements',
      'Built-in supervision scheduling and documentation'
    ],
    accountTypes: ['individual']
  },
  {
    id: 'supervisee-management',
    title: 'Multi-Supervisee Dashboard',
    description: 'Manage all your supervisees from one powerful interface',
    feature: 'Comprehensive oversight and compliance tracking',
    icon: Users,
    demoAction: 'Explore dashboard',
    benefits: [
      'Track multiple supervisee progress simultaneously',
      'Automated compliance monitoring and alerts',
      'Streamlined documentation and reporting'
    ],
    accountTypes: ['supervisor']
  },
  {
    id: 'progress-analytics',
    title: 'Professional Growth Analytics',
    description: 'Data-driven insights that accelerate your licensure journey',
    feature: 'Comprehensive competency and outcome tracking',
    icon: BarChart3,
    demoAction: 'View analytics',
    benefits: [
      'Visual competency progression charts',
      'Hour tracking with state-specific requirements',
      'Professional portfolio generation'
    ],
    accountTypes: ['individual', 'supervisor', 'enterprise']
  },
  {
    id: 'enterprise-scale',
    title: 'Enterprise Program Management',
    description: 'Scale training programs across your entire organization',
    feature: 'Multi-program oversight with advanced analytics',
    icon: Target,
    demoAction: 'See enterprise features',
    benefits: [
      'Cross-program performance analytics',
      'Custom workflow configuration',
      'Advanced reporting and compliance tools'
    ],
    accountTypes: ['enterprise']
  }
];

export const InteractiveProductTour = ({ accountType, onComplete, onSkip }: InteractiveProductTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showDemo, setShowDemo] = useState(false);

  // Filter steps based on account type
  const relevantSteps = tourSteps.filter(step => 
    step.accountTypes.includes(accountType)
  );

  const currentStepData = relevantSteps[currentStep];
  const isLastStep = currentStep === relevantSteps.length - 1;

  const handleNext = () => {
    if (currentStepData) {
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    }
    
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTryDemo = () => {
    setShowDemo(true);
    // In a real implementation, this would trigger the actual demo
    setTimeout(() => {
      setShowDemo(false);
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
    }, 2000);
  };

  if (!currentStepData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <currentStepData.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {relevantSteps.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / relevantSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>{currentStepData.title}</span>
                {completedSteps.has(currentStepData.id) && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription>{currentStepData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Badge variant="secondary" className="mb-3">
                    {currentStepData.feature}
                  </Badge>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">Key Benefits:</h4>
                    <ul className="space-y-1">
                      {currentStepData.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {currentStepData.demoAction && (
                  <div className="border-t pt-4">
                    <Button 
                      onClick={handleTryDemo}
                      disabled={showDemo}
                      className="w-full"
                      variant="outline"
                    >
                      {showDemo ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Clock className="h-4 w-4" />
                          </motion.div>
                          Running demo...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {currentStepData.demoAction}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Demo Overlay */}
          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-blue-600/20 flex items-center justify-center z-10"
              >
                <Card className="p-6 bg-white dark:bg-gray-900">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="mb-4"
                    >
                      <currentStepData.icon className="h-12 w-12 text-blue-600 mx-auto" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">Demo in Progress</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Experiencing {currentStepData.title}...
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {relevantSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <Button onClick={handleNext}>
            {isLastStep ? 'Complete Tour' : 'Next'}
            {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};