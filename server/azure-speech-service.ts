import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Buffer } from 'buffer';

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  speaker?: string;
  timestamp: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    speaker?: string;
  }>;
}

export class AzureSpeechService {
  private speechConfig: sdk.SpeechConfig;
  private recognizer: sdk.SpeechRecognizer | null = null;

  constructor() {
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const serviceRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!subscriptionKey) {
      throw new Error('Azure Speech Service key not configured');
    }

    this.speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    this.speechConfig.speechRecognitionLanguage = 'en-US';
    this.speechConfig.enableDictation();
    
    // Enable speaker identification for clinical sessions
    this.speechConfig.setProperty(
      sdk.PropertyId.SpeechServiceConnection_EnableAudioLogging, 
      "false" // HIPAA compliance
    );
  }

  /**
   * Transcribe audio blob to text using Azure Speech Services
   */
  async transcribeAudioBlob(audioBlob: Buffer, sessionMetadata?: any): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      try {
        // Create audio config from buffer
        const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBlob);
        
        // Create recognizer
        this.recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
        
        let fullTranscript = '';
        let confidence = 0;
        const segments: Array<{ text: string; start: number; end: number; speaker?: string; }> = [];

        // Handle recognition results
        this.recognizer.recognized = (s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            fullTranscript += e.result.text + ' ';
            confidence = Math.max(confidence, e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult) ? 0.9 : 0.8);
            
            segments.push({
              text: e.result.text,
              start: e.result.offset / 10000, // Convert to milliseconds
              end: (e.result.offset + e.result.duration) / 10000,
              speaker: this.detectSpeaker(e.result.text, sessionMetadata)
            });
          }
        };

        // Handle session stopped
        this.recognizer.sessionStopped = (s, e) => {
          this.recognizer?.close();
          resolve({
            transcript: fullTranscript.trim(),
            confidence,
            timestamp: Date.now(),
            segments
          });
        };

        // Handle errors
        this.recognizer.canceled = (s, e) => {
          console.error('Azure Speech recognition canceled:', e.errorDetails);
          this.recognizer?.close();
          reject(new Error(`Speech recognition failed: ${e.errorDetails}`));
        };

        // Start recognition
        this.recognizer.recognizeOnceAsync(
          (result) => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve({
                transcript: result.text,
                confidence: 0.95,
                timestamp: Date.now(),
                segments: [{
                  text: result.text,
                  start: 0,
                  end: result.duration / 10000,
                  speaker: this.detectSpeaker(result.text, sessionMetadata)
                }]
              });
            } else {
              reject(new Error(`Recognition failed: ${result.reason}`));
            }
            this.recognizer?.close();
          },
          (error) => {
            console.error('Azure Speech recognition error:', error);
            this.recognizer?.close();
            reject(error);
          }
        );

      } catch (error) {
        console.error('Azure Speech Service initialization error:', error);
        reject(error);
      }
    });
  }

  /**
   * Start continuous recognition for real-time transcription
   */
  async startContinuousRecognition(
    onTranscript: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      this.recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

      // Handle real-time results
      this.recognizer.recognizing = (s, e) => {
        if (e.result.text) {
          onTranscript({
            transcript: e.result.text,
            confidence: 0.7, // Interim result
            timestamp: Date.now()
          });
        }
      };

      this.recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          onTranscript({
            transcript: e.result.text,
            confidence: 0.95, // Final result
            timestamp: Date.now(),
            speaker: this.detectSpeaker(e.result.text)
          });
        }
      };

      this.recognizer.canceled = (s, e) => {
        onError(`Recognition canceled: ${e.errorDetails}`);
        this.stopContinuousRecognition();
      };

      this.recognizer.sessionStopped = (s, e) => {
        this.stopContinuousRecognition();
      };

      // Start continuous recognition
      this.recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('Azure continuous recognition started');
        },
        (error) => {
          onError(`Failed to start recognition: ${error}`);
        }
      );

    } catch (error) {
      onError(`Continuous recognition setup failed: ${error}`);
    }
  }

  /**
   * Stop continuous recognition
   */
  async stopContinuousRecognition(): Promise<void> {
    if (this.recognizer) {
      await new Promise<void>((resolve) => {
        this.recognizer!.stopContinuousRecognitionAsync(
          () => {
            this.recognizer!.close();
            this.recognizer = null;
            resolve();
          },
          (error) => {
            console.error('Error stopping recognition:', error);
            this.recognizer!.close();
            this.recognizer = null;
            resolve();
          }
        );
      });
    }
  }

  /**
   * Simple speaker detection based on content analysis
   */
  private detectSpeaker(text: string, sessionMetadata?: any): string {
    // Clinical heuristics for speaker identification
    const therapistKeywords = ['how are you feeling', 'let\'s explore', 'what do you think', 'that\'s interesting'];
    const clientKeywords = ['i feel', 'i think', 'i\'m worried', 'i can\'t'];
    
    const textLower = text.toLowerCase();
    
    const therapistScore = therapistKeywords.reduce((score, keyword) => 
      score + (textLower.includes(keyword) ? 1 : 0), 0);
    const clientScore = clientKeywords.reduce((score, keyword) => 
      score + (textLower.includes(keyword) ? 1 : 0), 0);
    
    if (therapistScore > clientScore) {
      return 'Therapist';
    } else if (clientScore > therapistScore) {
      return 'Client';
    } else {
      return 'Speaker';
    }
  }

  /**
   * Process uploaded audio file
   */
  async processUploadedFile(fileBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
    try {
      // Convert various audio formats to WAV if needed
      const wavBuffer = await this.convertToWav(fileBuffer, mimeType);
      return await this.transcribeAudioBlob(wavBuffer);
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      throw error;
    }
  }

  /**
   * Convert audio to WAV format for Azure processing
   */
  private async convertToWav(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // For now, assume input is already compatible
    // In production, you'd use ffmpeg or similar for format conversion
    return buffer;
  }
}

export default AzureSpeechService;