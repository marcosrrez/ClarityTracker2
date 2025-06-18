import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  Video, 
  Users, 
  Upload, 
  FileText, 
  Shield, 
  Play, 
  Pause, 
  Square,
  Brain,
  Activity
} from 'lucide-react';

interface SessionAnalysis {
  sessionSummary: string;
  ebpTechniques: Array<{
    technique: string;
    adherence: number;
    effectiveness: number;
  }>;
  supervisionPoints: Array<{
    category: string;
    content: string;
    priority: string;
  }>;
  progressNote: {
    format: string;
    sections: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
    confidence: number;
  };
  riskAssessment: {
    level: string;
    factors: string[];
  };
  therapeuticAlliance: number;
  recommendations: string[];
}

type SessionMode = 'in-person' | 'telehealth' | 'upload' | 'describe';

export function MinimalistRecorder() {
  const [currentMode, setCurrentMode] = useState<SessionMode>('in-person');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionType, setSessionType] = useState('individual');
  const [primaryIntervention, setPrimaryIntervention] = useState('cbt');
  const [analysisResult, setAnalysisResult] = useState<SessionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer management
  useEffect(() => {
    if (isRecording && !isPaused) {
      durationIntervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setSessionDuration(0);
  };

  const pauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;
    
    setIsProcessingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('analysisType', 'session-analysis');

      const response = await fetch('/api/sessions/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      }
    } catch (error) {
      console.error('File processing failed:', error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const processSessionDescription = async () => {
    if (!sessionDescription.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-session-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: sessionDescription,
          sessionType,
          primaryIntervention,
          analysisType: 'comprehensive'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      }
    } catch (error) {
      console.error('Session analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      {/* Minimalist Header */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-white">Session Recording</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Real-time clinical intelligence and analysis
        </p>
      </div>

      {/* Main Recording Widget - Mentalyc Inspired */}
      <Card className="border-0 shadow-lg bg-white dark:bg-gray-900">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            
            {/* Recording Status Circle */}
            <div className="flex items-center justify-center">
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 shadow-lg shadow-red-500/25' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25'
              }`}>
                <Mic className="h-10 w-10 text-white" />
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                )}
              </div>
            </div>
            
            {/* Session Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {currentMode === 'in-person' ? 'Record in-person' :
                 currentMode === 'telehealth' ? 'Record telehealth' :
                 currentMode === 'upload' ? 'Upload recording' :
                 currentMode === 'describe' ? 'Describe session' :
                 'Record session'}
              </h3>
              
              {currentMode === 'upload' || currentMode === 'describe' ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For any session setup
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recording duration: {formatDuration(sessionDuration)}
                  </p>
                  {isRecording && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-red-500 font-medium">LIVE</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* File Upload Interface */}
            {currentMode === 'upload' && (
              <div className="space-y-4 pt-4 border-t">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-12"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadedFile ? uploadedFile.name : 'Choose Audio/Video File'}
                </Button>
                {uploadedFile && (
                  <Button
                    onClick={processUploadedFile}
                    className="w-full"
                    disabled={isProcessingFile}
                  >
                    {isProcessingFile ? 'Processing...' : 'Analyze Recording'}
                  </Button>
                )}
              </div>
            )}

            {/* Session Description Interface */}
            {currentMode === 'describe' && (
              <div className="space-y-4 pt-4 border-t text-left">
                <Textarea
                  placeholder="Describe your session: What happened? What techniques did you use? How did the client respond?"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="min-h-24 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="couples">Couples</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={primaryIntervention} onValueChange={setPrimaryIntervention}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cbt">CBT</SelectItem>
                      <SelectItem value="dbt">DBT</SelectItem>
                      <SelectItem value="emdr">EMDR</SelectItem>
                      <SelectItem value="psychodynamic">Psychodynamic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={processSessionDescription}
                  className="w-full"
                  disabled={!sessionDescription.trim() || isAnalyzing}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Session'}
                </Button>
              </div>
            )}

            {/* Recording Controls */}
            {(currentMode === 'in-person' || currentMode === 'telehealth') && (
              <div className="space-y-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
                    size="lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex-1 h-12"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mode Switcher */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentMode === 'in-person' ? 'default' : 'ghost'}
                  className="text-sm h-10 justify-start"
                  onClick={() => setCurrentMode('in-person')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  In-person
                </Button>
                <Button
                  variant={currentMode === 'telehealth' ? 'default' : 'ghost'}
                  className="text-sm h-10 justify-start"
                  onClick={() => setCurrentMode('telehealth')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Telehealth
                </Button>
                <Button
                  variant={currentMode === 'upload' ? 'default' : 'ghost'}
                  className="text-sm h-10 justify-start"
                  onClick={() => setCurrentMode('upload')}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant={currentMode === 'describe' ? 'default' : 'ghost'}
                  className="text-sm h-10 justify-start"
                  onClick={() => setCurrentMode('describe')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Describe
                </Button>
              </div>
            </div>

            {/* HIPAA Compliance */}
            <div className="flex items-center justify-center text-xs text-gray-400 gap-1 pt-2">
              <Shield className="h-3 w-3" />
              100% HIPAA Compliant
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Main Analysis Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Clinical Session Analysis</h3>
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>

                {/* Session Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Session Summary</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    {analysisResult.sessionSummary}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {analysisResult.therapeuticAlliance}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Therapeutic Alliance</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {analysisResult.ebpTechniques.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">EBP Techniques</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {analysisResult.supervisionPoints?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Supervision Points</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {analysisResult.riskAssessment.level.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Risk Level</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence-Based Practice Analysis */}
          {analysisResult.ebpTechniques.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h4 className="text-lg font-medium mb-4">Evidence-Based Practice Analysis</h4>
                <div className="space-y-4">
                  {analysisResult.ebpTechniques.map((ebp, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{ebp.technique}</h5>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            Adherence: {ebp.adherence}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Effectiveness: {ebp.effectiveness}%
                          </Badge>
                        </div>
                      </div>
                      {ebp.supervisorNotes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-2">
                          <strong>Supervisor Notes:</strong> {ebp.supervisorNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supervision Markers */}
          {analysisResult.supervisionPoints && analysisResult.supervisionPoints.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h4 className="text-lg font-medium mb-4">Supervision Markers</h4>
                <div className="space-y-3">
                  {analysisResult.supervisionPoints.map((point, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={point.priority === 'high' ? 'destructive' : point.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {point.category.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">{point.priority} priority</span>
                      </div>
                      <p className="text-sm">{point.content}</p>
                      {point.transcriptSnippet && (
                        <blockquote className="text-xs text-gray-500 mt-1 italic">
                          "{point.transcriptSnippet}"
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SOAP Progress Note */}
          {analysisResult.progressNote && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Progress Note (SOAP Format)</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Confidence: {analysisResult.progressNote.confidence}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Completeness: {analysisResult.progressNote.completeness}%
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 text-sm font-mono">
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400">SUBJECTIVE:</strong>
                    <p className="mt-1 ml-4">{analysisResult.progressNote.sections.subjective}</p>
                  </div>
                  <div>
                    <strong className="text-green-600 dark:text-green-400">OBJECTIVE:</strong>
                    <p className="mt-1 ml-4">{analysisResult.progressNote.sections.objective}</p>
                  </div>
                  <div>
                    <strong className="text-purple-600 dark:text-purple-400">ASSESSMENT:</strong>
                    <p className="mt-1 ml-4">{analysisResult.progressNote.sections.assessment}</p>
                  </div>
                  <div>
                    <strong className="text-orange-600 dark:text-orange-400">PLAN:</strong>
                    <p className="mt-1 ml-4">{analysisResult.progressNote.sections.plan}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clinical Recommendations */}
          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <h4 className="text-lg font-medium mb-4">Clinical Recommendations</h4>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}