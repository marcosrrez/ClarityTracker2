import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface TranscriptionSegment {
  text: string;
  timestamp: number;
  confidence: number;
  speaker?: string;
}

interface SpeechRecognitionConfig {
  onTranscription: (segment: TranscriptionSegment) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onStop: () => void;
}

export class AzureSpeechService {
  private recognizer: SpeechSDK.SpeechRecognizer | null = null;
  private audioConfig: SpeechSDK.AudioConfig | null = null;
  private speechConfig: SpeechSDK.SpeechConfig | null = null;
  private isRecognizing = false;

  constructor() {
    // Azure Speech configuration will be initialized when starting recognition
    // to avoid exposing credentials on the frontend
  }

  async startRecognition(config: SpeechRecognitionConfig): Promise<void> {
    if (this.isRecognizing) {
      throw new Error('Recognition already in progress');
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio configuration from microphone
      this.audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      if (!this.speechConfig || !this.audioConfig) {
        throw new Error('Failed to initialize speech configuration');
      }

      // Create speech recognizer
      this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, this.audioConfig);

      // Set up event handlers
      this.recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          // Interim results for real-time display
          config.onTranscription({
            text: e.result.text,
            timestamp: Date.now(),
            confidence: 0.8, // Interim confidence
          });
        }
      };

      this.recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          // Final transcription result
          config.onTranscription({
            text: e.result.text,
            timestamp: Date.now(),
            confidence: this.parseConfidence(e.result),
          });
        }
      };

      this.recognizer.canceled = (s, e) => {
        console.error('Speech recognition canceled:', e.errorDetails);
        config.onError(e.errorDetails || 'Recognition was canceled');
        this.isRecognizing = false;
      };

      this.recognizer.sessionStopped = (s, e) => {
        console.log('Session stopped');
        config.onStop();
        this.isRecognizing = false;
      };

      // Start continuous recognition
      this.recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Speech recognition started');
          this.isRecognizing = true;
          config.onStart();
        },
        (error) => {
          console.error('Failed to start recognition:', error);
          config.onError(error);
          this.isRecognizing = false;
        }
      );

      // Clean up the stream since we're using Azure's audio config
      stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      config.onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  stopRecognition(): void {
    if (this.recognizer && this.isRecognizing) {
      this.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('Speech recognition stopped');
          this.isRecognizing = false;
        },
        (error) => {
          console.error('Error stopping recognition:', error);
          this.isRecognizing = false;
        }
      );
    }
  }

  isRecording(): boolean {
    return this.isRecognizing;
  }

  private parseConfidence(result: SpeechSDK.SpeechRecognitionResult): number {
    // Extract confidence from result properties
    try {
      const json = JSON.parse(result.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult));
      return json.NBest?.[0]?.Confidence || 0.8;
    } catch {
      return 0.8; // Default confidence if parsing fails
    }
  }

  dispose(): void {
    this.stopRecognition();
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }
    if (this.audioConfig) {
      this.audioConfig.close();
      this.audioConfig = null;
    }
  }
}

export default AzureSpeechService;