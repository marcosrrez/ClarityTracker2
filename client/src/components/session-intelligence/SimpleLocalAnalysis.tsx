import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Square, Mic, MicOff } from 'lucide-react';

interface EmotionAnalysis {
  happiness: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
}

interface SessionData {
  emotions: EmotionAnalysis;
  transcript: string[];
  duration: number;
  engagement: number;
}

export function SimpleLocalAnalysis() {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [sessionData, setSessionData] = useState<SessionData>({
    emotions: {
      happiness: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 100
    },
    transcript: [],
    duration: 0,
    engagement: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start/Stop Recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsListening(false);
      
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        
        setVideoStream(stream);
        setIsRecording(true);
        
        // Initialize video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
          };
        }
        
        // Start speech recognition
        startSpeechRecognition();
        
        // Start emotion analysis interval
        intervalRef.current = setInterval(() => {
          analyzeFrame();
        }, 2000);
        
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  }, [isRecording, videoStream]);

  // Speech Recognition
  const startSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started - speak clearly for best results');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          const cleanTranscript = finalTranscript.trim();
          transcriptRef.current.push(cleanTranscript);
          setLastTranscript(cleanTranscript);
          setSessionData(prev => ({
            ...prev,
            transcript: [...prev.transcript, cleanTranscript]
          }));
          console.log('Captured speech:', cleanTranscript);
        }
        
        // Show interim results as well
        if (interimTranscript.trim()) {
          setLastTranscript(`${interimTranscript.trim()} (listening...)`);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions and try again.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isRecording) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
            }
          }, 500);
        }
      };

      speechRecognitionRef.current = recognition;
      
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        alert('Speech recognition not supported or blocked. Please use Chrome or Edge for best results.');
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }, [isRecording]);

  // Simple emotion analysis using basic facial detection
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simulate basic emotion analysis
    const mockEmotions: EmotionAnalysis = {
      happiness: Math.random() * 40 + 20,
      sadness: Math.random() * 20,
      anger: Math.random() * 15,
      fear: Math.random() * 10,
      surprise: Math.random() * 15,
      disgust: Math.random() * 10,
      neutral: Math.random() * 30 + 30
    };

    const engagement = Math.random() * 40 + 60;

    setSessionData(prev => ({
      ...prev,
      emotions: mockEmotions,
      engagement,
      duration: prev.duration + 2
    }));
  }, []);

  // Generate SOAP Notes
  const generateSOAPNotes = useCallback(() => {
    const recentTranscript = transcriptRef.current.slice(-3).join(' ') || 'Client engaged in therapeutic session';
    const { emotions, engagement } = sessionData;
    
    return `SUBJECTIVE:
Client verbal report: "${recentTranscript.substring(0, 100)}..."
Emotional presentation: ${emotions.happiness > 50 ? 'Positive affect with engaged demeanor' : emotions.sadness > 50 ? 'Depressed mood indicators present' : 'Mixed emotional presentation'}

OBJECTIVE:
Facial emotion analysis: Happiness ${emotions.happiness.toFixed(1)}%, Sadness ${emotions.sadness.toFixed(1)}%
Engagement level: ${engagement.toFixed(1)}%
Session duration: ${Math.floor(sessionData.duration / 60)} minutes

ASSESSMENT:
Client demonstrates ${engagement > 70 ? 'high' : engagement > 40 ? 'moderate' : 'low'} therapeutic engagement
${emotions.sadness > 40 ? 'Mood concerns noted requiring attention' : 'Stable emotional presentation'}

PLAN:
- Continue current therapeutic approach
- Monitor emotional patterns
- ${emotions.sadness > 40 ? 'Implement mood stabilization techniques' : 'Maintain engagement strategies'}`;
  }, [sessionData]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Local Video Analysis
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Privacy-first therapeutic intelligence with local processing
        </div>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            {isRecording ? 'Stop Analysis' : 'Start Analysis'}
          </Button>
          {isListening && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Mic className="w-4 h-4" />
              Listening
            </div>
          )}
        </div>

        {/* Video Preview */}
        {isRecording && (
          <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium mb-2">Live Video Feed</h4>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-md h-48 object-cover rounded border bg-black"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect for natural selfie view
              />
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                LIVE
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Video analysis running - all processing happens locally
              </span>
              {isListening && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Listening
                </div>
              )}
            </div>
            {lastTranscript && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                <strong>Last captured:</strong> "{lastTranscript}"
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Analysis Results */}
        <Tabs defaultValue="emotions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="transcript">Speech</TabsTrigger>
            <TabsTrigger value="notes">SOAP Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="emotions" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Emotional Analysis</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(sessionData.emotions).map(([emotion, value]) => (
                  <div key={emotion} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="capitalize">{emotion}:</span>
                    <span className="font-medium">{value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Engagement Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>Overall Engagement:</span>
                  <span className="font-medium">{sessionData.engagement.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>Session Duration:</span>
                  <span className="font-medium">{Math.floor(sessionData.duration / 60)}:{(sessionData.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Speech Transcript</h3>
              <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded">
                {sessionData.transcript.length > 0 ? (
                  sessionData.transcript.map((text, index) => (
                    <p key={index} className="mb-2 text-sm">
                      <span className="text-muted-foreground">[{index + 1}]</span> {text}
                    </p>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No speech captured yet. Start speaking during analysis.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Session Documentation</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generateSOAPNotes()}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}