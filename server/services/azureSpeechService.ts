import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { WebSocket } from 'ws';

interface TranscriptionSession {
  id: string;
  recognizer: SpeechSDK.SpeechRecognizer;
  audioConfig: SpeechSDK.AudioConfig;
  websocket: WebSocket;
  isActive: boolean;
}

export class ServerAzureSpeechService {
  private sessions = new Map<string, TranscriptionSession>();

  constructor() {
    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      throw new Error('Azure Speech credentials not configured');
    }
  }

  async startTranscription(sessionId: string, websocket: WebSocket): Promise<void> {
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