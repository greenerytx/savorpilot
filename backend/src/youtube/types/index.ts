/**
 * Types for YouTube video processing
 */

export interface VideoMetadata {
  title: string;
  duration: number; // in seconds
  channel: string;
  thumbnail: string;
  description?: string;
}

export interface OcrFrameResult {
  framePath: string;
  timestamp: number; // in seconds
  ocrText: string;
}

export interface FrameAnalysis {
  timestamp: number;
  analysis: {
    ingredients?: Array<{
      quantity?: number;
      unit?: string;
      name: string;
      notes?: string;
    }>;
    steps?: Array<{
      instruction: string;
      duration?: number;
    }>;
    otherText?: string;
  };
}

export interface ExtractionContext {
  jobId: string;
  jobDir: string;
  videoPath?: string;
  audioPath?: string;
  framesDir?: string;
}

export interface JobProgress {
  status: string;
  currentStep: string;
  progress: number;
  framesExtracted: number;
  framesWithText: number;
}
