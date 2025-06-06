import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface TranscriptionSegment {
  text: string;
  timestamp: number;
  confidence: number;
  speaker?: string;
}

export interface AzureSpeechConfig {
  subscriptionKey: string;
  serviceRegion: string;
  language?: string;
}

export class AzureSpeechService {
  private speechConfig: SpeechSDK.SpeechConfig | null = null;
  private recognizer: SpeechSDK.SpeechRecognizer | null = null;
  private isRecognizing = false;
  private onTranscriptionCallback?: (segment: TranscriptionSegment) => void;
  private onErrorCallback?: (error: string) => void;

  constructor(config: AzureSpeechConfig) {
    this.initializeSpeechConfig(config);
  }

  private initializeSpeechConfig(config: AzureSpeechConfig) {
    try {
      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        config.subscriptionKey,
        config.serviceRegion
      );
      
      // Configure speech recognition settings
      this.speechConfig.speechRecognitionLanguage = config.language || 'en-US';
      this.speechConfig.enableDictation();
      
      // Enable detailed results for confidence scores
      this.speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;
      
      console.log('Azure Speech Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure Speech Service:', error);
      throw new Error('Azure Speech Service initialization failed');
    }
  }

  async startContinuousRecognition(
    onTranscription: (segment: TranscriptionSegment) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.speechConfig) {
      throw new Error('Speech config not initialized');
    }

    if (this.isRecognizing) {
      console.warn('Recognition already in progress');
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      // Create audio config from microphone stream
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      // Create speech recognizer
      this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, audioConfig);
      
      this.onTranscriptionCallback = onTranscription;
      this.onErrorCallback = onError;

      // Set up event handlers
      this.setupEventHandlers();

      // Start continuous recognition
      this.recognizer.startContinuousRecognitionAsync(
        () => {
          this.isRecognizing = true;
          console.log('Continuous recognition started');
        },
        (error) => {
          console.error('Failed to start recognition:', error);
          this.onErrorCallback?.(error);
        }
      );

    } catch (error) {
      console.error('Error starting recognition:', error);
      throw new Error('Failed to start speech recognition');
    }
  }

  private setupEventHandlers() {
    if (!this.recognizer) return;

    // Handle recognized speech (final results)
    this.recognizer.recognized = (sender, event) => {
      if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const segment: TranscriptionSegment = {
          text: event.result.text,
          timestamp: Date.now(),
          confidence: this.getConfidenceScore(event.result),
        };
        
        this.onTranscriptionCallback?.(segment);
      }
    };

    // Handle partial recognition (interim results)
    this.recognizer.recognizing = (sender, event) => {
      if (event.result.text) {
        const segment: TranscriptionSegment = {
          text: event.result.text,
          timestamp: Date.now(),
          confidence: 0.5, // Lower confidence for partial results
        };
        
        this.onTranscriptionCallback?.(segment);
      }
    };

    // Handle session events
    this.recognizer.sessionStarted = (sender, event) => {
      console.log('Speech recognition session started');
    };

    this.recognizer.sessionStopped = (sender, event) => {
      console.log('Speech recognition session stopped');
      this.isRecognizing = false;
    };

    // Handle errors
    this.recognizer.canceled = (sender, event) => {
      console.error('Speech recognition canceled:', event.reason);
      
      if (event.reason === SpeechSDK.CancellationReason.Error) {
        this.onErrorCallback?.(event.errorDetails || 'Recognition error occurred');
      }
      
      this.isRecognizing = false;
    };
  }

  private getConfidenceScore(result: SpeechSDK.SpeechRecognitionResult): number {
    try {
      // Try to extract confidence from detailed results
      const detailed = JSON.parse(result.json);
      if (detailed.NBest && detailed.NBest[0] && detailed.NBest[0].Confidence) {
        return detailed.NBest[0].Confidence;
      }
    } catch (error) {
      // Fallback if detailed results are not available
    }
    
    return 0.8; // Default confidence score
  }

  stopRecognition(): void {
    if (this.recognizer && this.isRecognizing) {
      this.recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log('Recognition stopped successfully');
          this.isRecognizing = false;
        },
        (error) => {
          console.error('Error stopping recognition:', error);
          this.isRecognizing = false;
        }
      );
    }
  }

  dispose(): void {
    this.stopRecognition();
    
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }
    
    this.speechConfig = null;
    this.onTranscriptionCallback = undefined;
    this.onErrorCallback = undefined;
  }

  isActive(): boolean {
    return this.isRecognizing;
  }

  // Utility method to test Azure Speech Service connectivity
  static async testConnection(config: AzureSpeechConfig): Promise<boolean> {
    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        config.subscriptionKey,
        config.serviceRegion
      );
      
      // Create a simple test recognizer
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      
      return new Promise((resolve) => {
        recognizer.sessionStarted = () => {
          recognizer.close();
          resolve(true);
        };
        
        recognizer.canceled = () => {
          recognizer.close();
          resolve(false);
        };
        
        // Start a brief test session
        recognizer.startContinuousRecognitionAsync(
          () => {
            setTimeout(() => {
              recognizer.stopContinuousRecognitionAsync();
            }, 100);
          },
          () => resolve(false)
        );
      });
    } catch (error) {
      console.error('Azure Speech Service connection test failed:', error);
      return false;
    }
  }
}