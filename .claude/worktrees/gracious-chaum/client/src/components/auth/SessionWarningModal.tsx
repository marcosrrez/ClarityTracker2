import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Shield } from 'lucide-react';

interface SessionWarningModalProps {
  isOpen: boolean;
  onStaySignedIn: () => void;
  onSignOut: () => void;
  remainingSeconds: number;
}

export const SessionWarningModal = ({
  isOpen,
  onStaySignedIn,
  onSignOut,
  remainingSeconds,
}: SessionWarningModalProps) => {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    setCountdown(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto sign out when countdown reaches 0
          onSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onSignOut]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Session Timeout Warning</DialogTitle>
          </div>
          <DialogDescription>
            Your session will expire due to inactivity. This helps protect your clinical data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown Display */}
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Automatic sign out in:
              </span>
            </div>
            <div className="text-2xl font-mono font-bold text-amber-900">
              {formatTime(countdown)}
            </div>
          </div>

          {/* Security Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p>
                Automatic session timeout helps protect your clinical data and ensures HIPAA compliance,
                especially on shared computers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onSignOut}
              className="flex-1"
            >
              Sign Out Now
            </Button>
            <Button
              onClick={onStaySignedIn}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Stay Signed In
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can adjust session timeout settings in your account preferences.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};