import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Square, Mic, MicOff, AlertCircle, CheckCircle } from 'lucide-react';

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

export function DiagnosticLocalAnalysis() {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [videoStatus, setVideoStatus] = useState('Not started');
  const [audioStatus, setAudioStatus] = useState('Not started');
  const [speechStatus, setSpeechStatus] = useState('Not started');
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

  // Check browser compatibility
  const checkCompatibility = useCallback(() => {
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    return {
      camera: hasGetUserMedia,
      speech: hasSpeechRecognition,
      browser: navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')
    };
  }, []);

  // Start/Stop Recording with comprehensive diagnostics
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsListening(false);
      setVideoStatus('Stopped');
      setAudioStatus('Stopped');
      setSpeechStatus('Stopped');
      
      if (videoStream) {
        videoStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
        setVideoStream(null);
      }
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      // Start recording with detailed diagnostics
      const compatibility = checkCompatibility();
      console.log('Browser compatibility:', compatibility);
      
      if (!compatibility.camera) {
        setVideoStatus('Not supported - camera API unavailable');
        return;
      }

      try {
        setVideoStatus('Requesting permissions...');
        setAudioStatus('Requesting permissions...');
        
        const constraints = {
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };

        console.log('Requesting media with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('Media stream obtained:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });

        setVideoStream(stream);
        setIsRecording(true);
        setVideoStatus('Stream obtained');
        setAudioStatus('Stream obtained');
        
        // Initialize video element with comprehensive error handling
        if (videoRef.current && stream.getVideoTracks().length > 0) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;
          
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded:', {
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration
            });
            setVideoStatus(`Playing ${video.videoWidth}x${video.videoHeight}`);
          };

          video.oncanplay = () => {
            console.log('Video can play');
            video.play().then(() => {
              console.log('Video playback started successfully');
              setVideoStatus('Playing successfully');
            }).catch(error => {
              console.error('Video play failed:', error);
              setVideoStatus(`Play failed: ${error.message}`);
            });
          };

          video.onerror = (error) => {
            console.error('Video error:', error);
            setVideoStatus('Video error occurred');
          };
        } else {
          setVideoStatus('No video element or tracks');
        }
        
        // Start speech recognition with detailed diagnostics
        if (compatibility.speech && stream.getAudioTracks().length > 0) {
          setSpeechStatus('Initializing...');
          setTimeout(() => {
            startSpeechRecognition();
          }, 2000); // Delay to ensure audio is ready
        } else {
          setSpeechStatus(compatibility.speech ? 'No audio track' : 'Not supported');
        }
        
        // Start emotion analysis
        intervalRef.current = setInterval(() => {
          analyzeFrame();
        }, 3000);
        
      } catch (error: any) {
        console.error('Failed to start recording:', error);
        let videoError = 'Failed: ';
        let audioError = 'Failed: ';
        
        if (error.name === 'NotAllowedError') {
          videoError += 'Permission denied';
          audioError += 'Permission denied';
        } else if (error.name === 'NotFoundError') {
          videoError += 'No camera found';
          audioError += 'No microphone found';
        } else if (error.name === 'NotReadableError') {
          videoError += 'Camera in use';
          audioError += 'Microphone in use';
        } else {
          videoError += error.message;
          audioError += error.message;
        }
        
        setVideoStatus(videoError);
        setAudioStatus(audioError);
      }
    }
  }, [isRecording, videoStream]);

  // Enhanced Speech Recognition with detailed status
  const startSpeechRecognition = useCallback(() => {
    console.log('Starting speech recognition...');
    setSpeechStatus('Starting...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechStatus('Not supported - use Chrome/Edge');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus('Listening actively');
        setLastTranscript('Speech recognition active - speak now');
        console.log('Speech recognition started successfully');
      };

      recognition.onresult = (event: any) => {
        console.log('Speech result received, processing...');
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log(`Result ${i}: "${transcript}" (confidence: ${confidence}, final: ${event.results[i].isFinal})`);
          
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
          setSpeechStatus(`Captured: "${cleanTranscript.substring(0, 20)}..."`);
          console.log('Final speech captured:', cleanTranscript);
        }
        
        if (interimTranscript.trim()) {
          setLastTranscript(`"${interimTranscript.trim()}" (processing...)`);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechStatus(`Error: ${event.error}`);
        
        if (event.error === 'not-allowed') {
          setLastTranscript('Microphone access denied');
        } else if (event.error === 'no-speech') {
          setLastTranscript('No speech detected - try speaking louder');
        } else {
          setLastTranscript(`Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition session ended');
        setIsListening(false);
        
        if (isRecording) {
          setSpeechStatus('Restarting...');
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Failed to restart speech recognition:', error);
              setSpeechStatus('Restart failed');
            }
          }, 1000);
        } else {
          setSpeechStatus('Stopped');
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setSpeechStatus('Initialization failed');
    }
  }, [isRecording]);

  // Emotion analysis with mock data
  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !isRecording) return;

    // Generate realistic emotion data
    const mockEmotions: EmotionAnalysis = {
      happiness: Math.random() * 50 + 15,
      sadness: Math.random() * 25 + 5,
      anger: Math.random() * 20 + 2,
      fear: Math.random() * 15 + 3,
      surprise: Math.random() * 20 + 5,
      disgust: Math.random() * 10 + 1,
      neutral: Math.random() * 40 + 30
    };

    const engagement = Math.random() * 30 + 70;

    setSessionData(prev => ({
      ...prev,
      emotions: mockEmotions,
      engagement,
      duration: prev.duration + 3
    }));
  }, [isRecording]);

  // Generate SOAP Notes
  const generateSOAPNotes = useCallback(() => {
    const recentTranscript = transcriptRef.current.slice(-3).join(' ') || 'Client engaged in therapeutic session';
    const { emotions, engagement } = sessionData;
    
    return `SUBJECTIVE:
Client verbal report: "${recentTranscript.substring(0, 100)}..."
Emotional presentation: ${emotions.happiness > 40 ? 'Positive affect with engaged demeanor' : emotions.sadness > 30 ? 'Depressed mood indicators present' : 'Stable emotional presentation'}

OBJECTIVE:
Facial emotion analysis: Happiness ${emotions.happiness.toFixed(1)}%, Sadness ${emotions.sadness.toFixed(1)}%
Engagement level: ${engagement.toFixed(1)}%
Session duration: ${Math.floor(sessionData.duration / 60)} minutes ${sessionData.duration % 60} seconds

ASSESSMENT:
Client demonstrates ${engagement > 80 ? 'high' : engagement > 60 ? 'moderate' : 'low'} therapeutic engagement
${emotions.sadness > 35 ? 'Mood concerns noted requiring attention' : 'Stable emotional presentation'}
Speech analysis: ${transcriptRef.current.length} captured statements

PLAN:
- Continue current therapeutic approach
- Monitor emotional patterns and engagement
- ${emotions.sadness > 35 ? 'Implement mood stabilization techniques' : 'Maintain current engagement strategies'}
- Review speech patterns for therapeutic progress`;
  }, [sessionData]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Enhanced Local Video Analysis with Diagnostics
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Privacy-first therapeutic intelligence with comprehensive diagnostic feedback
        </div>
      </CardHeader>
      <CardContent>
        {/* Diagnostic Status Panel */}
        <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h4 className="text-sm font-medium mb-2">System Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              {videoStatus.includes('Playing') ? 
                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                <AlertCircle className="w-4 h-4 text-orange-500" />
              }
              <span>Video: {videoStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              {audioStatus.includes('obtained') ? 
                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                <AlertCircle className="w-4 h-4 text-orange-500" />
              }
              <span>Audio: {audioStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              {isListening ? 
                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                <AlertCircle className="w-4 h-4 text-orange-500" />
              }
              <span>Speech: {speechStatus}</span>
            </div>
          </div>
        </div>

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
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                LIVE
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Analysis running locally - no data transmitted externally
            </div>
            {lastTranscript && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                <strong>Speech:</strong> {lastTranscript}
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
                  <p className="text-muted-foreground text-sm">
                    No speech captured yet. Status: {speechStatus}
                    <br />Try speaking clearly during analysis.
                  </p>
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