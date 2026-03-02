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
      // Validate configuration
      if (!config.subscriptionKey || !config.serviceRegion) {
        throw new Error('Missing Azure Speech Service credentials');
      }

      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        config.subscriptionKey,
        config.serviceRegion
      );
      
      // Configure speech recognition settings
      this.speechConfig.speechRecognitionLanguage = config.language || 'en-US';
      this.speechConfig.enableDictation();
      
      // Enable detailed results for confidence scores
      this.speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;
      
      // Set connection timeout and retry policies
      this.speechConfig.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, "2000");
      this.speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000");
      
      console.log('Azure Speech Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure Speech Service:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(`Azure Speech Service initialization failed: ${error.message}`);
      }
      throw error;
    }
  }

  async startContinuousRecognition(
    onTranscription: (segment: TranscriptionSegment) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.speechConfig) {
      const errorMsg = 'Azure Speech Service not properly configured. Please verify your Azure credentials.';
      console.error(errorMsg);
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    if (this.isRecognizing) {
      console.warn('Recognition already in progress');
      return;
    }

    this.onTranscriptionCallback = onTranscription;
    this.onErrorCallback = onError;

    try {
      // Check microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      // Create audio config from microphone stream
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      // Create speech recognizer
      this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, audioConfig);
      
      // Set up event handlers
      this.setupEventHandlers();

      // Start continuous recognition with timeout protection
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const timeoutError = 'Azure Speech Service connection timeout. Falling back to browser speech recognition.';
          console.warn(timeoutError);
          this.isRecognizing = false;
          onError?.(timeoutError);
          reject(new Error(timeoutError));
        }, 15000); // 15 second timeout

        this.recognizer!.startContinuousRecognitionAsync(
          () => {
            clearTimeout(timeout);
            this.isRecognizing = true;
            console.log('Azure Speech Service: Continuous recognition started successfully');
            resolve();
          },
          (error) => {
            clearTimeout(timeout);
            console.error('Azure Speech Service failed to start:', error);
            this.isRecognizing = false;
            const errorMsg = `Azure Speech Service connection failed: ${error}. Switching to browser speech recognition.`;
            onError?.(errorMsg);
            reject(new Error(errorMsg));
          }
        );
      });

    } catch (error: any) {
      console.error('Error starting Azure Speech recognition:', error);
      this.isRecognizing = false;
      const errorMsg = error.name === 'NotAllowedError' 
        ? 'Microphone access denied. Please enable microphone permissions.'
        : `Failed to start Azure Speech recognition: ${error.message}`;
      onError?.(errorMsg);
      throw new Error(errorMsg);
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