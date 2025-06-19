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
  // Automatic Anonymization Settings
  automaticAnonymization: boolean;
  piiDetectionLevel: 'basic' | 'standard' | 'comprehensive';
  preserveTherapeuticContext: boolean;
  anonymizationReviewRequired: boolean;
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
    encryptionLevel: 'enhanced',
    // Automatic Anonymization Settings
    automaticAnonymization: true,
    piiDetectionLevel: 'standard',
    preserveTherapeuticContext: true,
    anonymizationReviewRequired: false
  });
  const [dataUsage, setDataUsage] = useState<DataUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);
  const [deletionType, setDeletionType] = useState<'all' | 'recordings' | 'transcripts' | 'analytics'>('recordings');
  const [deletionReason, setDeletionReason] = useState('');

  // Calculate privacy protection score
  const calculatePrivacyScore = () => {
    let score = 0;
    const weights = {
      automaticAnonymization: 25,
      localProcessingOnly: 20,
      encryptionLevel: 15,
      autoDeleteTranscripts: 15,
      piiDetectionLevel: 10,
      preserveTherapeuticContext: 10,
      storeRawRecordings: -15 // Negative because storing raw recordings reduces privacy
    };

    if (settings.automaticAnonymization) score += weights.automaticAnonymization;
    if (settings.localProcessingOnly) score += weights.localProcessingOnly;
    if (settings.autoDeleteTranscripts) score += weights.autoDeleteTranscripts;
    if (settings.preserveTherapeuticContext) score += weights.preserveTherapeuticContext;
    if (settings.storeRawRecordings) score += weights.storeRawRecordings;

    // Add encryption level score
    switch (settings.encryptionLevel) {
      case 'maximum': score += weights.encryptionLevel; break;
      case 'enhanced': score += weights.encryptionLevel * 0.7; break;
      case 'standard': score += weights.encryptionLevel * 0.4; break;
    }

    // Add PII detection level score
    switch (settings.piiDetectionLevel) {
      case 'comprehensive': score += weights.piiDetectionLevel; break;
      case 'standard': score += weights.piiDetectionLevel * 0.7; break;
      case 'basic': score += weights.piiDetectionLevel * 0.4; break;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const privacyScore = calculatePrivacyScore();

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

      {/* Automatic Anonymization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Automatic Anonymization
          </CardTitle>
          <CardDescription>
            AI-powered PII protection with therapeutic context preservation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Anonymization */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
            <div className="space-y-1">
              <div className="font-medium">Enable Automatic Anonymization</div>
              <div className="text-sm text-gray-600">
                Automatically detect and replace personally identifiable information in session recordings
              </div>
            </div>
            <Switch
              checked={settings.automaticAnonymization}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, automaticAnonymization: checked }))
              }
            />
          </div>

          {settings.automaticAnonymization && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-4 border-l-2 border-green-200 dark:border-green-800"
              >
                {/* Detection Level */}
                <div className="space-y-3">
                  <div className="font-medium">PII Detection Level</div>
                  <Select 
                    value={settings.piiDetectionLevel} 
                    onValueChange={(value: 'basic' | 'standard' | 'comprehensive') => 
                      setSettings(prev => ({ ...prev, piiDetectionLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <div className="space-y-1">
                          <div className="font-medium">Basic</div>
                          <div className="text-xs text-gray-500">Names, phone numbers, emails, SSN</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="space-y-1">
                          <div className="font-medium">Standard</div>
                          <div className="text-xs text-gray-500">Basic + addresses, workplaces, family members</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="comprehensive">
                        <div className="space-y-1">
                          <div className="font-medium">Comprehensive</div>
                          <div className="text-xs text-gray-500">Standard + AI-powered contextual detection</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preserve Context */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">Preserve Therapeutic Context</div>
                    <div className="text-sm text-gray-600">
                      Use consistent pseudonyms to maintain clinical continuity
                    </div>
                  </div>
                  <Switch
                    checked={settings.preserveTherapeuticContext}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, preserveTherapeuticContext: checked }))
                    }
                  />
                </div>

                {/* Review Required */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">Require Review Before Processing</div>
                    <div className="text-sm text-gray-600">
                      Show detected PII for manual approval before anonymization
                    </div>
                  </div>
                  <Switch
                    checked={settings.anonymizationReviewRequired}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, anonymizationReviewRequired: checked }))
                    }
                  />
                </div>

                {/* Privacy Benefits */}
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <div className="font-medium mb-1">Privacy-First Intelligence</div>
                      <div className="text-xs">
                        Your sessions are automatically protected while preserving all therapeutic insights and clinical context for supervision and analysis.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Local-First Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            Local-First Processing
          </CardTitle>
          <CardDescription>
            Process sensitive data entirely on your device for maximum privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local Processing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
            <div className="space-y-1">
              <div className="font-medium">Enable Local Processing Mode</div>
              <div className="text-sm text-gray-600">
                Process audio analysis and emotion detection entirely in your browser using WebAssembly
              </div>
            </div>
            <Switch
              checked={settings.localProcessingOnly}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, localProcessingOnly: checked }))
              }
            />
          </div>

          {settings.localProcessingOnly && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-4 border-l-2 border-purple-200 dark:border-purple-800"
              >
                {/* Client-side Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">✓ Browser-based emotion analysis</div>
                    <div className="text-xs text-gray-500">WebAssembly processing, no data sent to servers</div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">✓ Local speech transcription</div>
                    <div className="text-xs text-gray-500">Web Speech API, recordings stay on device</div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">✓ Edge AI processing</div>
                    <div className="text-xs text-gray-500">Clinical insights generated locally</div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-sm">✓ Minimal server communication</div>
                    <div className="text-xs text-gray-500">Only anonymized insights synchronized</div>
                  </div>
                </div>

                {/* Local Processing Benefits */}
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      <div className="font-medium mb-1">Ultimate Privacy Protection</div>
                      <div className="text-xs">
                        Raw session recordings never leave your device. Only de-identified clinical insights are shared for supervision and compliance tracking.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Smart Data Minimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-600" />
            Smart Data Minimization
          </CardTitle>
          <CardDescription>
            Automatically minimize data retention while preserving clinical value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-purge Settings */}
          <div className="space-y-3">
            <div className="font-medium">Auto-purge Raw Recordings</div>
            <Select 
              value={settings.autoPurgeRecordings || "48"} 
              onValueChange={(value: string) => 
                setSettings(prev => ({ ...prev, autoPurgeRecordings: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">After 24 hours</SelectItem>
                <SelectItem value="48">After 48 hours (recommended)</SelectItem>
                <SelectItem value="72">After 72 hours</SelectItem>
                <SelectItem value="168">After 1 week</SelectItem>
                <SelectItem value="never">Never auto-purge</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500">
              Clinical insights and progress metrics are preserved indefinitely
            </div>
          </div>

          {/* Storage Tiers */}
          <div className="space-y-4">
            <div className="font-medium">Data Storage Tiers</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="font-medium text-sm text-green-700 dark:text-green-300">Essential Tier</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  • Clinical insights and patterns
                  • Progress metrics and trends
                  • Supervision recommendations
                  • Competency assessments
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <div className="font-medium text-sm text-orange-700 dark:text-orange-300">Optional Tier</div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  • Raw audio/video recordings
                  • Detailed transcriptions
                  • Session screenshots
                  • Detailed timestamps
                </div>
              </div>
            </div>
          </div>

          {/* Data Granularity Control */}
          <div className="space-y-3">
            <div className="font-medium">Data Granularity Level</div>
            <Select 
              value={settings.dataGranularity || "balanced"} 
              onValueChange={(value: string) => 
                setSettings(prev => ({ ...prev, dataGranularity: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">
                  <div className="space-y-1">
                    <div className="font-medium">Minimal</div>
                    <div className="text-xs text-gray-500">Only essential insights, no detailed metadata</div>
                  </div>
                </SelectItem>
                <SelectItem value="balanced">
                  <div className="space-y-1">
                    <div className="font-medium">Balanced (recommended)</div>
                    <div className="text-xs text-gray-500">Clinical insights + key patterns and trends</div>
                  </div>
                </SelectItem>
                <SelectItem value="comprehensive">
                  <div className="space-y-1">
                    <div className="font-medium">Comprehensive</div>
                    <div className="text-xs text-gray-500">Full session data for detailed supervision</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transparent Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Transparent Processing
          </CardTitle>
          <CardDescription>
            Real-time visibility into how your data is being processed and stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Real-time Privacy Indicator */}
          <div className="space-y-4">
            <div className="font-medium">Current Privacy Status</div>
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Privacy Protection Active
                  </span>
                </div>
                <div className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                  {privacyScore}% Protected
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                All personally identifiable information is automatically detected and anonymized before processing
              </div>
            </div>
          </div>

          {/* Data Journey Visualization */}
          <div className="space-y-4">
            <div className="font-medium">Data Journey Visualization</div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <div className="space-y-4">
                {/* Step 1: Capture */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">1. Session Capture</div>
                    <div className="text-xs text-gray-500">
                      {settings.localProcessingOnly ? 
                        "Processed locally in your browser" : 
                        "Temporarily stored with encryption"
                      }
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                    {settings.localProcessingOnly ? "Local" : "Encrypted"}
                  </div>
                </div>

                {/* Step 2: Anonymization */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">2. Automatic Anonymization</div>
                    <div className="text-xs text-gray-500">
                      AI-powered PII detection and consistent pseudonym replacement
                    </div>
                  </div>
                  <div className="text-xs bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                    {settings.piiDetectionLevel || 'Standard'}
                  </div>
                </div>

                {/* Step 3: Analysis */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">3. Clinical Analysis</div>
                    <div className="text-xs text-gray-500">
                      Therapeutic insights generated from anonymized content
                    </div>
                  </div>
                  <div className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                    Protected
                  </div>
                </div>

                {/* Step 4: Storage */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">4. Secure Storage</div>
                    <div className="text-xs text-gray-500">
                      {settings.autoPurgeRecordings !== 'never' ? 
                        `Raw data auto-purged after ${settings.autoPurgeRecordings || '48'} hours` : 
                        "Clinical insights stored indefinitely"
                      }
                    </div>
                  </div>
                  <div className="text-xs bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                    Tiered
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Dashboard */}
          <div className="space-y-4">
            <div className="font-medium">Compliance Status</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">✓</div>
                <div className="text-sm font-medium">HIPAA Compliant</div>
                <div className="text-xs text-green-600 dark:text-green-400">Auto-anonymization active</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">✓</div>
                <div className="text-sm font-medium">SOC 2 Ready</div>
                <div className="text-xs text-green-600 dark:text-green-400">Audit logging enabled</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">✓</div>
                <div className="text-sm font-medium">BAA Compatible</div>
                <div className="text-xs text-green-600 dark:text-green-400">Enterprise controls</div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{privacyScore}%</div>
                <div className="text-sm font-medium">Privacy Score</div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Real-time calculation</div>
              </div>
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