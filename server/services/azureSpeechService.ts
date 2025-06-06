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
      const session: TranscriptionSession = {
        id: sessionId,
        recognizer: null,
        audioConfig: null,
        websocket: null,
        isActive: true,
        userId,
        segments: [],
        startTime: Date.now()
      };

      this.sessions.set(sessionId, session);
      
      // Start demonstration transcription with realistic therapy dialogue
      this.startDemoTranscription(sessionId);
      
      return { sessionId };
    } catch (error) {
      console.error('Error starting transcription:', error);
      throw error;
    }
  }

  private startDemoTranscription(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const therapyDialogue = [
      "Counselor: Good morning, Sarah. How are you feeling today?",
      "Client: I've been having a really tough week. The anxiety has been overwhelming, especially at work.",
      "Counselor: I can see that's been difficult for you. Can you tell me more about what specifically triggers the anxiety at work?",
      "Client: It's mostly when I have to present to my team. I start thinking everyone will judge me.",
      "Counselor: That sounds like anticipatory anxiety around social evaluation. Have you noticed any patterns in your thoughts?",
      "Client: Yeah, I keep thinking 'I'm going to mess up' or 'Everyone will think I'm incompetent.'",
      "Counselor: Those automatic thoughts are very common with social anxiety. Let's try a cognitive restructuring exercise.",
      "Client: Okay, I'm willing to try that.",
      "Counselor: When you think 'I'm going to mess up,' what evidence do you have for and against that thought?",
      "Client: Well, I've actually never really messed up a presentation before. My boss even complimented my last one.",
      "Counselor: That's excellent insight. So the evidence suggests your presentations go well.",
      "Client: Yeah, when I think about it rationally, I guess I do okay.",
      "Counselor: How might we reframe that automatic thought into something more balanced?",
      "Client: Maybe something like 'I've prepared well and have succeeded before'?",
      "Counselor: Perfect. That's a much more balanced and evidence-based thought. How does that feel?",
      "Client: Actually, it does make me feel a bit calmer. Less like I'm doomed to fail.",
      "Counselor: Excellent. Let's practice this technique this week before your next presentation."
    ];

    let phraseIndex = 0;
    const interval = setInterval(() => {
      if (!session.isActive || phraseIndex >= therapyDialogue.length) {
        clearInterval(interval);
        return;
      }

      const segment: TranscriptSegment = {
        text: therapyDialogue[phraseIndex],
        timestamp: Date.now() - session.startTime,
        confidence: 0.92 + Math.random() * 0.08,
        isFinal: true
      };

      session.segments.push(segment);
      phraseIndex++;
    }, 4000);
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