import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { WebSocket } from 'ws';

interface TranscriptionSession {
  id: string;
  recognizer: SpeechSDK.SpeechRecognizer | null;
  audioConfig: SpeechSDK.AudioConfig | null;
  websocket: WebSocket | null;
  isActive: boolean;
  userId: string;
  segments: TranscriptSegment[];
  startTime: number;
}

interface TranscriptSegment {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
}

export class ServerAzureSpeechService {
  private sessions = new Map<string, TranscriptionSession>();

  constructor() {
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      throw new Error('Azure Speech credentials not configured');
    }
  }

  async startTranscription(sessionId: string, userId: string): Promise<{ sessionId: string }> {
    try {
      // Initialize Azure Speech recognizer
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY!,
        process.env.AZURE_SPEECH_REGION!
      );
      speechConfig.speechRecognitionLanguage = 'en-US';
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      const session: TranscriptionSession = {
        id: sessionId,
        recognizer,
        audioConfig,
        websocket: null,
        isActive: true,
        userId,
        segments: [],
        startTime: Date.now()
      };

      // Set up real-time recognition events
      recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          const segment: TranscriptSegment = {
            text: e.result.text,
            timestamp: Date.now(),
            confidence: 0.8,
            isFinal: false
          };
          session.segments.push(segment);
        }
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const segment: TranscriptSegment = {
            text: e.result.text,
            timestamp: Date.now(),
            confidence: 0.95,
            isFinal: true
          };
          session.segments.push(segment);
        }
      };

      this.sessions.set(sessionId, session);
      
      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync();
      
      return { sessionId };
    } catch (error) {
      console.error('Error starting transcription:', error);
      throw error;
    }
  }

  private startSimulatedTranscription(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const simulatedPhrases = [
      "Hello, welcome to our session today.",
      "How are you feeling right now?",
      "I notice you seem a bit anxious about this.",
      "Let's explore what's been on your mind lately.",
      "Can you tell me more about your experiences this week?",
      "I see that this situation is causing you some distress.",
      "What coping strategies have you tried before?",
      "That sounds like a significant challenge you're facing.",
      "You're showing great self-awareness in recognizing this.",
      "Let's work together on some techniques that might help."
    ];

    let phraseIndex = 0;
    const interval = setInterval(() => {
      if (!session.isActive || phraseIndex >= simulatedPhrases.length) {
        clearInterval(interval);
        return;
      }

      const segment: TranscriptSegment = {
        text: simulatedPhrases[phraseIndex],
        timestamp: Date.now() - session.startTime,
        confidence: 0.85 + Math.random() * 0.15,
        isFinal: true
      };

      session.segments.push(segment);
      phraseIndex++;
    }, 3000);
  }

  async getTranscriptSegments(sessionId: string): Promise<TranscriptSegment[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    
    // Return new segments since last call
    const newSegments = session.segments.splice(0);
    return newSegments;
  }

  async stopTranscription(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isActive = false;
    
    if (session.recognizer) {
      session.recognizer.close();
    }
    
    this.sessions.delete(sessionId);
  }

  // Original websocket-based method for reference
  async startWebSocketTranscription(sessionId: string, websocket: WebSocket): Promise<void> {
    try {
      // Create speech configuration
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY!,
        process.env.AZURE_SPEECH_REGION!
      );
      
      speechConfig.speechRecognitionLanguage = 'en-US';
      speechConfig.enableDictation();

      // Create audio configuration for push audio stream
      const pushStream = SpeechSDK.AudioInputStream.createPushStream();
      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);

      // Create speech recognizer
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      // Set up event handlers
      recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          this.sendTranscriptionUpdate(websocket, {
            type: 'interim',
            text: e.result.text,
            confidence: 0.8,
            timestamp: Date.now()
          });
        }
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          this.sendTranscriptionUpdate(websocket, {
            type: 'final',
            text: e.result.text,
            confidence: this.parseConfidence(e.result),
            timestamp: Date.now()
          });
        }
      };

      recognizer.canceled = (s, e) => {
        console.error('Speech recognition canceled:', e.errorDetails);
        this.sendTranscriptionUpdate(websocket, {
          type: 'error',
          error: e.errorDetails || 'Recognition was canceled',
          timestamp: Date.now()
        });
        this.stopTranscription(sessionId);
      };

      recognizer.sessionStopped = (s, e) => {
        console.log('Speech recognition session stopped');
        this.stopTranscription(sessionId);
      };

      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Azure Speech recognition started for session:', sessionId);
          this.sendTranscriptionUpdate(websocket, {
            type: 'started',
            timestamp: Date.now()
          });
        },
        (error) => {
          console.error('Failed to start recognition:', error);
          this.sendTranscriptionUpdate(websocket, {
            type: 'error',
            error: error,
            timestamp: Date.now()
          });
        }
      );

      // Store session
      this.sessions.set(sessionId, {
        id: sessionId,
        recognizer,
        audioConfig,
        websocket,
        isActive: true
      });

      // Handle audio data from websocket
      websocket.on('message', (data) => {
        if (Buffer.isBuffer(data)) {
          // Push audio data to Azure Speech recognizer
          pushStream.write(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
        }
      });

    } catch (error) {
      console.error('Error starting Azure Speech transcription:', error);
      this.sendTranscriptionUpdate(websocket, {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    }
  }

  stopTranscription(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('Azure Speech recognition stopped for session:', sessionId);
          session.recognizer.close();
          session.audioConfig.close();
          session.isActive = false;
          this.sessions.delete(sessionId);
        },
        (error) => {
          console.error('Error stopping recognition:', error);
          session.isActive = false;
          this.sessions.delete(sessionId);
        }
      );
    }
  }

  private sendTranscriptionUpdate(websocket: WebSocket, update: any): void {
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify(update));
    }
  }

  private parseConfidence(result: SpeechSDK.SpeechRecognitionResult): number {
    try {
      const json = JSON.parse(result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult));
      return json.NBest?.[0]?.Confidence || 0.8;
    } catch {
      return 0.8;
    }
  }

  cleanup(): void {
    for (const [sessionId, session] of this.sessions) {
      this.stopTranscription(sessionId);
    }
    this.sessions.clear();
  }
}

export default ServerAzureSpeechService;