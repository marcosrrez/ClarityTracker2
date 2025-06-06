interface VideoServiceConfig {
  onVideoFrame?: (frame: ImageData) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onStop: () => void;
}

export class VideoService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isRecording = false;
  private frameCallback?: (frame: ImageData) => void;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  async startVideo(config: VideoServiceConfig): Promise<HTMLVideoElement> {
    if (this.isRecording) {
      throw new Error('Video recording already in progress');
    }

    try {
      // Request camera permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false // Audio handled separately by Azure Speech
      });

      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;

      // Set up frame callback for analysis
      this.frameCallback = config.onVideoFrame;

      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Video element not created'));
          return;
        }

        this.videoElement.onloadedmetadata = () => {
          resolve();
        };

        this.videoElement.onerror = () => {
          reject(new Error('Failed to load video'));
        };
      });

      this.isRecording = true;
      
      // Start frame analysis if callback provided
      if (this.frameCallback) {
        this.startFrameAnalysis();
      }

      config.onStart();
      return this.videoElement;

    } catch (error) {
      console.error('Error starting video:', error);
      config.onError(error instanceof Error ? error.message : 'Unknown video error');
      throw error;
    }
  }

  stopVideo(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.isRecording = false;
    this.frameCallback = undefined;
  }

  private startFrameAnalysis(): void {
    if (!this.isRecording || !this.videoElement || !this.canvas || !this.context || !this.frameCallback) {
      return;
    }

    const analyzeFrame = () => {
      if (!this.isRecording || !this.videoElement || !this.canvas || !this.context || !this.frameCallback) {
        return;
      }

      // Set canvas size to match video
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      // Draw current video frame to canvas
      this.context.drawImage(this.videoElement, 0, 0);

      // Get image data for analysis
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Send frame for analysis
      this.frameCallback(imageData);

      // Schedule next frame analysis (limit to 5 FPS for performance)
      setTimeout(() => {
        requestAnimationFrame(analyzeFrame);
      }, 200);
    };

    requestAnimationFrame(analyzeFrame);
  }

  isRecordingVideo(): boolean {
    return this.isRecording;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  captureFrame(): string | null {
    if (!this.videoElement || !this.canvas || !this.context) {
      return null;
    }

    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    this.context.drawImage(this.videoElement, 0, 0);
    
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  dispose(): void {
    this.stopVideo();
    this.canvas = null;
    this.context = null;
  }
}

export default VideoService;