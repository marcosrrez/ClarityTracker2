import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Share2, CheckCircle } from 'lucide-react';

interface ProgressData {
  directHours: number;
  groupHours: number;
  supervisionHours: number;
  totalClientHours: number;
  progressToLicense: number;
  nextMilestone: string;
  complianceStatus: 'on_track' | 'behind' | 'overdue';
  lastUpdated: Date;
}

interface Supervisor {
  id: string;
  name: string;
  title: string;
  email?: string;
}

interface ProgressSharingDialogProps {
  children: React.ReactNode;
  currentProgress: ProgressData;
}

export function ProgressSharingDialog({ children, currentProgress }: ProgressSharingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [shareTypes, setShareTypes] = useState({
    hours: true,
    progress: true,
    compliance: true,
    milestones: true
  });

  useEffect(() => {
    if (isOpen && user?.uid) {
      loadSupervisors();
    }
  }, [isOpen, user?.uid]);

  const loadSupervisors = async () => {
    try {
      const response = await fetch(`/api/supervisors/${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        setSupervisors(data);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
    }
  };

  const toggleSupervisor = (supervisorId: string) => {
    const newSelected = new Set(selectedSupervisors);
    if (newSelected.has(supervisorId)) {
      newSelected.delete(supervisorId);
    } else {
      newSelected.add(supervisorId);
    }
    setSelectedSupervisors(newSelected);
  };

  const handleShare = async () => {
    if (selectedSupervisors.size === 0) {
      toast({
        title: 'No Supervisors Selected',
        description: 'Please select at least one supervisor to share with.',
        variant: 'destructive'
      });
      return;
    }

    setIsSharing(true);
    try {
      const shareData = {
        supervisorIds: Array.from(selectedSupervisors),
        progressData: currentProgress,
        shareTypes,
        sharedAt: new Date().toISOString(),
        lacUserId: user?.uid
      };

      const response = await fetch('/api/progress/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareData)
      });

      if (response.ok) {
        toast({
          title: 'Progress Shared Successfully',
          description: `Your progress has been shared with ${selectedSupervisors.size} supervisor${selectedSupervisors.size > 1 ? 's' : ''}.`
        });
        setIsOpen(false);
        setSelectedSupervisors(new Set());
      } else {
        throw new Error('Failed to share progress');
      }
    } catch (error) {
      toast({
        title: 'Sharing Failed',
        description: 'Unable to share progress. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={20} />
            Share Progress Update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Progress Summary */}
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                Current Progress Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Direct Hours</span>
                    <span className="font-medium">{currentProgress.directHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Group Hours</span>
                    <span className="font-medium">{currentProgress.groupHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Supervision Hours</span>
                    <span className="font-medium">{currentProgress.supervisionHours}h</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Client Hours</span>
                    <span className="font-medium">{currentProgress.totalClientHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">License Progress</span>
                    <span className="font-medium">{currentProgress.progressToLicense}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <Badge variant={currentProgress.complianceStatus === 'on_track' ? 'default' : 
                                  currentProgress.complianceStatus === 'behind' ? 'secondary' : 'destructive'}>
                      {currentProgress.complianceStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Next Milestone:</strong> {currentProgress.nextMilestone}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What to Share */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">What would you like to share?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hours"
                  checked={shareTypes.hours}
                  onCheckedChange={(checked) => setShareTypes(prev => ({ ...prev, hours: !!checked }))}
                />
                <label htmlFor="hours" className="text-sm font-medium">
                  Hour summaries (Direct, Group, Supervision)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="progress"
                  checked={shareTypes.progress}
                  onCheckedChange={(checked) => setShareTypes(prev => ({ ...prev, progress: !!checked }))}
                />
                <label htmlFor="progress" className="text-sm font-medium">
                  License progress percentage
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="compliance"
                  checked={shareTypes.compliance}
                  onCheckedChange={(checked) => setShareTypes(prev => ({ ...prev, compliance: !!checked }))}
                />
                <label htmlFor="compliance" className="text-sm font-medium">
                  Compliance status
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="milestones"
                  checked={shareTypes.milestones}
                  onCheckedChange={(checked) => setShareTypes(prev => ({ ...prev, milestones: !!checked }))}
                />
                <label htmlFor="milestones" className="text-sm font-medium">
                  Next milestone information
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Select Supervisors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Supervisors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supervisors.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No supervisors found. Add supervisors in the Supervisors tab first.
                </p>
              ) : (
                supervisors.map((supervisor) => (
                  <div 
                    key={supervisor.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSupervisors.has(supervisor.id) 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => toggleSupervisor(supervisor.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {supervisor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {supervisor.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {supervisor.title}
                          </p>
                        </div>
                      </div>
                      {selectedSupervisors.has(supervisor.id) && (
                        <CheckCircle size={20} className="text-blue-600" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleShare}
              disabled={isSharing || selectedSupervisors.size === 0}
              className="flex-1"
            >
              {isSharing ? 'Sharing...' : `Share with ${selectedSupervisors.size} Supervisor${selectedSupervisors.size !== 1 ? 's' : ''}`}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}