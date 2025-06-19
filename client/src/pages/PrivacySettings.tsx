import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Shield, Eye, Download, Trash2, Lock, Server, Globe, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';

interface PrivacySettings {
  dataRetentionDays: number;
  storeRawRecordings: boolean;
  localProcessingOnly: boolean;
  shareForResearch: boolean;
  supervisionAccess: boolean;
  autoDeleteTranscripts: boolean;
  encryptionLevel: 'standard' | 'enhanced' | 'maximum';
}

interface DataUsage {
  totalSessions: number;
  storageUsedMB: number;
  dataTypes: {
    insights: number;
    transcripts: number;
    recordings: number;
    analytics: number;
  };
  retentionBreakdown: {
    category: string;
    count: number;
    sizeKB: number;
    oldestDate: string;
  }[];
}

export default function PrivacySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    dataRetentionDays: 90,
    storeRawRecordings: false,
    localProcessingOnly: false,
    shareForResearch: false,
    supervisionAccess: true,
    autoDeleteTranscripts: true,
    encryptionLevel: 'enhanced'
  });
  const [dataUsage, setDataUsage] = useState<DataUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);
  const [deletionType, setDeletionType] = useState<'all' | 'recordings' | 'transcripts' | 'analytics'>('recordings');
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    loadPrivacySettings();
    loadDataUsage();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch('/api/privacy/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const loadDataUsage = async () => {
    try {
      const response = await fetch('/api/privacy/data-usage');
      if (response.ok) {
        const data = await response.json();
        setDataUsage(data);
      }
    } catch (error) {
      console.error('Failed to load data usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        // Refresh data usage after settings change
        await loadDataUsage();
      }
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataDeletion = async () => {
    try {
      const response = await fetch('/api/privacy/delete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: deletionType,
          reason: deletionReason
        })
      });

      if (response.ok) {
        setShowDataDeletion(false);
        setDeletionReason('');
        await loadDataUsage();
      }
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };

  const exportUserData = async () => {
    try {
      const response = await fetch('/api/privacy/export-data');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `claritylog-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const getPrivacyScore = () => {
    let score = 0;
    if (settings.localProcessingOnly) score += 25;
    if (!settings.storeRawRecordings) score += 20;
    if (settings.autoDeleteTranscripts) score += 15;
    if (settings.dataRetentionDays <= 30) score += 20;
    if (settings.encryptionLevel === 'maximum') score += 20;
    return Math.min(score, 100);
  };

  const getEncryptionBadge = (level: string) => {
    const badges = {
      standard: { color: 'bg-yellow-100 text-yellow-800', icon: <Shield className="w-3 h-3" /> },
      enhanced: { color: 'bg-blue-100 text-blue-800', icon: <Lock className="w-3 h-3" /> },
      maximum: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> }
    };
    return badges[level as keyof typeof badges];
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Privacy & Data Control</h1>
        <p className="text-gray-600">Manage how your clinical data is processed, stored, and shared</p>
      </div>

      {/* Privacy Score Card */}
      <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Privacy Protection Score
          </CardTitle>
          <CardDescription>
            Your current privacy configuration strength
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">{getPrivacyScore()}%</span>
              <Badge variant="outline" className="bg-white">
                {getPrivacyScore() >= 80 ? 'Excellent' : getPrivacyScore() >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
            <Progress value={getPrivacyScore()} className="h-3" />
            <div className="text-sm text-gray-600">
              Higher scores indicate stronger privacy protection and data minimization
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Data Processing Controls
          </CardTitle>
          <CardDescription>
            Configure how your session data is processed and analyzed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local Processing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-900">
            <div className="space-y-1">
              <div className="font-medium">Local Processing Only</div>
              <div className="text-sm text-gray-600">
                Process audio and video analysis in your browser (highest privacy)
              </div>
            </div>
            <Switch 
              checked={settings.localProcessingOnly}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, localProcessingOnly: checked }))
              }
            />
          </div>

          {/* Store Raw Recordings */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <div className="font-medium">Store Raw Recordings</div>
              <div className="text-sm text-gray-600">
                Keep original audio/video files for supervision review
              </div>
            </div>
            <Switch 
              checked={settings.storeRawRecordings}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, storeRawRecordings: checked }))
              }
            />
          </div>

          {/* Auto-delete Transcripts */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <div className="font-medium">Auto-Delete Transcripts</div>
              <div className="text-sm text-gray-600">
                Automatically remove transcripts after analysis is complete
              </div>
            </div>
            <Switch 
              checked={settings.autoDeleteTranscripts}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoDeleteTranscripts: checked }))
              }
            />
          </div>

          {/* Encryption Level */}
          <div className="space-y-3">
            <div className="font-medium">Encryption Level</div>
            <Select 
              value={settings.encryptionLevel} 
              onValueChange={(value: 'standard' | 'enhanced' | 'maximum') => 
                setSettings(prev => ({ ...prev, encryptionLevel: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (AES-256)</SelectItem>
                <SelectItem value="enhanced">Enhanced (AES-256 + Key Rotation)</SelectItem>
                <SelectItem value="maximum">Maximum (End-to-End + Hardware)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Badge className={getEncryptionBadge(settings.encryptionLevel).color}>
                {getEncryptionBadge(settings.encryptionLevel).icon}
                {settings.encryptionLevel.charAt(0).toUpperCase() + settings.encryptionLevel.slice(1)} Encryption
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            Control how long your data is stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="font-medium">Automatic Deletion Period</div>
            <Select 
              value={settings.dataRetentionDays.toString()} 
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days (Maximum Privacy)</SelectItem>
                <SelectItem value="90">90 days (Recommended)</SelectItem>
                <SelectItem value="180">180 days (Standard)</SelectItem>
                <SelectItem value="365">1 year (Extended)</SelectItem>
                <SelectItem value="0">Never auto-delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Supervision Access */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-1">
              <div className="font-medium">Supervisor Access</div>
              <div className="text-sm text-gray-600">
                Allow supervisors to access session insights for clinical guidance
              </div>
            </div>
            <Switch 
              checked={settings.supervisionAccess}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, supervisionAccess: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Data Usage */}
      {dataUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Your Data Overview
            </CardTitle>
            <CardDescription>
              Current data stored in your ClarityLog account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-600">{dataUsage.totalSessions}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-600">{dataUsage.storageUsedMB}MB</div>
                <div className="text-sm text-gray-600">Storage Used</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950">
                <div className="text-2xl font-bold text-purple-600">{dataUsage.dataTypes.insights}</div>
                <div className="text-sm text-gray-600">Insights</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
                <div className="text-2xl font-bold text-orange-600">{dataUsage.dataTypes.recordings}</div>
                <div className="text-sm text-gray-600">Recordings</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Data Breakdown</h4>
              {dataUsage.retentionBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded border">
                  <div>
                    <div className="font-medium">{item.category}</div>
                    <div className="text-sm text-gray-600">
                      Oldest: {new Date(item.oldestDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.count} items</div>
                    <div className="text-sm text-gray-600">{Math.round(item.sizeKB / 1024)}MB</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management Actions</CardTitle>
          <CardDescription>
            Export, delete, or manage your stored data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportUserData} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export All Data
            </Button>
            <Button 
              onClick={() => setShowDataDeletion(true)} 
              variant="outline" 
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>

      {/* Data Deletion Modal */}
      <AnimatePresence>
        {showDataDeletion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Delete Data</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">What would you like to delete?</label>
                  <Select value={deletionType} onValueChange={setDeletionType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recordings">Raw Recordings Only</SelectItem>
                      <SelectItem value="transcripts">Transcripts Only</SelectItem>
                      <SelectItem value="analytics">Analytics Data Only</SelectItem>
                      <SelectItem value="all">All Data (Cannot be undone)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Reason for deletion (optional)</label>
                  <Textarea
                    placeholder="Help us improve by sharing why you're deleting this data..."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDataDeletion(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDataDeletion}
                    variant="destructive"
                    className="flex-1"
                  >
                    Delete Data
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}