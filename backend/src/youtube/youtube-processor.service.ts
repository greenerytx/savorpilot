import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { VideoMetadata, OcrFrameResult } from './types';

/**
 * Service for processing YouTube videos using external tools:
 * - yt-dlp for downloading videos and fetching metadata
 * - ffmpeg for audio extraction and frame extraction
 * - Tesseract for OCR pre-filtering
 */
@Injectable()
export class YouTubeProcessorService {
  private readonly logger = new Logger(YouTubeProcessorService.name);
  private readonly tempDir: string;
  private readonly ytDlpPath: string;
  private readonly ffmpegPath: string;
  private readonly tesseractPath: string;

  constructor(private readonly configService: ConfigService) {
    this.tempDir = path.join(process.cwd(), 'temp', 'youtube');
    this.ytDlpPath = this.configService.get('YT_DLP_PATH') || 'yt-dlp';
    this.ffmpegPath = this.configService.get('FFMPEG_PATH') || 'ffmpeg';
    this.tesseractPath = this.configService.get('TESSERACT_PATH') || 'tesseract';
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir(): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /**
   * Create a job-specific directory
   */
  async createJobDir(jobId: string): Promise<string> {
    const jobDir = path.join(this.tempDir, jobId);
    await fs.mkdir(jobDir, { recursive: true });
    await fs.mkdir(path.join(jobDir, 'frames'), { recursive: true });
    return jobDir;
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get video metadata without downloading
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '--dump-json',
        '--no-download',
        '--no-warnings',
        `https://youtube.com/watch?v=${videoId}`,
      ];

      // Normalize path for Windows
      const normalizedPath = this.ytDlpPath.replace(/\//g, '\\');

      // Build PowerShell command with single quotes
      // Don't normalize URLs (they should keep forward slashes)
      const quotedArgs = args.map((arg) => {
        const isUrl = arg.startsWith('http://') || arg.startsWith('https://');
        const processed = isUrl ? arg : arg.replace(/\//g, '\\');
        return `'${processed.replace(/'/g, "''")}'`;
      });
      const psCommand = `& '${normalizedPath.replace(/'/g, "''")}' ${quotedArgs.join(' ')}`;
      this.logger.debug(`Running (PowerShell): ${psCommand}`);

      const proc = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand], {
        windowsHide: true,
      });

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(output);
            resolve({
              title: data.title || 'Unknown Title',
              duration: data.duration || 0,
              channel: data.channel || data.uploader || 'Unknown Channel',
              thumbnail: data.thumbnail || '',
              description: data.description,
            });
          } catch (e) {
            this.logger.error('Failed to parse yt-dlp output', e);
            reject(new Error('Failed to parse video metadata'));
          }
        } else {
          this.logger.error(`yt-dlp failed with code ${code}: ${errorOutput}`);
          reject(new Error(`Failed to fetch video metadata: ${errorOutput}`));
        }
      });

      proc.on('error', (err) => {
        this.logger.error('yt-dlp process error', err);
        reject(new Error(`yt-dlp process error: ${err.message}`));
      });
    });
  }

  /**
   * Download video and extract audio
   */
  async downloadAndExtractAudio(
    videoId: string,
    jobDir: string,
    onProgress?: (percent: number) => void,
  ): Promise<{ videoPath: string; audioPath: string }> {
    const videoPath = path.join(jobDir, 'video.mp4');
    const audioPath = path.join(jobDir, 'audio.mp3');

    // Download video (limit to 720p for efficiency)
    // Use flexible format selector with multiple fallbacks
    this.logger.log(`Downloading video ${videoId}...`);
    await this.runProcess(
      this.ytDlpPath,
      [
        '-f',
        'bv*[height<=720]+ba/b[height<=720]/bv*+ba/b',
        '-o',
        videoPath,
        '--merge-output-format',
        'mp4',
        '--ffmpeg-location',
        path.dirname(this.ffmpegPath),
        `https://youtube.com/watch?v=${videoId}`,
      ],
      (output) => {
        // Parse progress from yt-dlp output
        const match = output.match(/(\d+\.?\d*)%/);
        if (match && onProgress) {
          onProgress(parseFloat(match[1]));
        }
      },
    );

    // Extract audio with ffmpeg - optimized for Whisper API (max 25MB)
    // Use mono, 16kHz sample rate, 48kbps for speech transcription
    // 48kbps * 3600s = 21.6MB for 1 hour (under 25MB limit)
    this.logger.log('Extracting audio (optimized for transcription)...');
    await this.runProcess(this.ffmpegPath, [
      '-i',
      videoPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-ac',
      '1', // Mono
      '-ar',
      '16000', // 16kHz sample rate (Whisper native)
      '-b:a',
      '48k', // 48kbps bitrate - allows up to ~70 min videos
      '-y',
      audioPath,
    ]);

    return { videoPath, audioPath };
  }

  /**
   * Extract frames using scene detection
   * Only captures frames when visual content changes significantly
   */
  async extractFrames(
    videoPath: string,
    framesDir: string,
    onProgress?: (extracted: number) => void,
  ): Promise<string[]> {
    this.logger.log('Extracting frames with scene detection...');

    // Use scene detection with threshold 0.3 (moderate sensitivity)
    // This captures frames only when there's a significant visual change
    await this.runProcess(this.ffmpegPath, [
      '-i',
      videoPath,
      '-vf',
      'select=gt(scene\\,0.3)',
      '-vsync',
      'vfr',
      '-frame_pts',
      '1',
      '-q:v',
      '3',
      '-y',
      path.join(framesDir, 'frame_%04d.jpg'),
    ]);

    // List extracted frames
    const files = await fs.readdir(framesDir);
    const frames = files
      .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
      .sort()
      .map((f) => path.join(framesDir, f));

    this.logger.log(`Extracted ${frames.length} frames`);

    if (onProgress) {
      onProgress(frames.length);
    }

    return frames;
  }

  /**
   * Run Tesseract OCR on frames to pre-filter those with text
   */
  async ocrFilterFrames(
    framePaths: string[],
    onProgress?: (processed: number, withText: number) => void,
  ): Promise<OcrFrameResult[]> {
    const results: OcrFrameResult[] = [];
    let processed = 0;
    let withText = 0;

    this.logger.log(`Running OCR on ${framePaths.length} frames...`);

    // Process in batches for efficiency
    const BATCH_SIZE = 5;
    for (let i = 0; i < framePaths.length; i += BATCH_SIZE) {
      const batch = framePaths.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (framePath) => {
          try {
            const text = await this.runTesseract(framePath);
            processed++;

            // Check if meaningful text was detected
            if (this.hasRelevantText(text)) {
              withText++;
              results.push({
                framePath,
                timestamp: this.extractTimestampFromFilename(framePath),
                ocrText: text,
              });
            }

            if (onProgress) {
              onProgress(processed, withText);
            }
          } catch (error) {
            this.logger.warn(`OCR failed for ${framePath}:`, error);
            processed++;
            if (onProgress) {
              onProgress(processed, withText);
            }
          }
        }),
      );
    }

    this.logger.log(`Found ${results.length} frames with relevant text`);
    return results;
  }

  /**
   * Run Tesseract on a single image
   */
  private async runTesseract(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Normalize paths for Windows
      const normalizedPath = this.tesseractPath.replace(/\//g, '\\');
      const normalizedImagePath = imagePath.replace(/\//g, '\\');

      // Build PowerShell command with single quotes
      const psCommand = `& '${normalizedPath.replace(/'/g, "''")}' '${normalizedImagePath.replace(/'/g, "''")}' 'stdout' '-l' 'eng+ara'`;

      const proc = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand], {
        windowsHide: true,
      });

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        // Tesseract returns 0 on success, but we accept any output
        resolve(output.trim());
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Check if OCR text contains recipe-relevant content
   */
  private hasRelevantText(text: string): boolean {
    if (!text || text.length < 10) return false;

    // Require at least 3 meaningful words
    const words = text.split(/\s+/).filter((w) => w.length > 2);
    if (words.length < 3) return false;

    // Recipe-related keywords (English and Arabic)
    const recipeKeywords = [
      // English measurements
      'cup',
      'cups',
      'tbsp',
      'tsp',
      'oz',
      'lb',
      'ml',
      'liter',
      'gram',
      'kg',
      // English cooking terms
      'ingredient',
      'step',
      'mix',
      'add',
      'cook',
      'bake',
      'minute',
      'hour',
      'preheat',
      'stir',
      'combine',
      'pour',
      'heat',
      'oven',
      'flour',
      'sugar',
      'salt',
      'butter',
      'oil',
      'water',
      'egg',
      // Numbers often indicate quantities
      '1/2',
      '1/4',
      '3/4',
      // Arabic cooking terms
      'ملعقة',
      'كوب',
      'غرام',
      'دقيقة',
      'ساعة',
      'يضاف',
      'يخلط',
    ];

    const lowerText = text.toLowerCase();
    const hasKeyword = recipeKeywords.some((kw) => lowerText.includes(kw));
    const hasNumbers = /\d+/.test(text);

    // Accept if has keywords, or has at least 5 words with numbers
    return hasKeyword || (words.length >= 5 && hasNumbers);
  }

  /**
   * Extract approximate timestamp from frame filename
   */
  private extractTimestampFromFilename(framePath: string): number {
    const filename = path.basename(framePath);
    const match = filename.match(/frame_(\d+)/);
    if (match) {
      // Frame number * estimated seconds per frame
      // This is approximate since we use scene detection
      return parseInt(match[1], 10) * 5;
    }
    return 0;
  }

  /**
   * Run a subprocess and return when complete
   */
  private runProcess(
    command: string,
    args: string[],
    onOutput?: (output: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Normalize path for Windows
      const normalizedCommand = command.replace(/\//g, '\\');

      // Quote args that contain spaces and normalize paths
      // Use single quotes for PowerShell compatibility
      // Don't normalize URLs or format selectors (they should keep forward slashes)
      const quotedArgs = args.map((arg) => {
        const isUrl = arg.startsWith('http://') || arg.startsWith('https://');
        // Format selectors contain patterns like bv*+ba/b - don't normalize these
        const isFormatSelector = /^[a-z0-9*+\[\]<>=\/]+$/i.test(arg) && arg.includes('/');
        const shouldNormalize = !isUrl && !isFormatSelector;
        const normalized = shouldNormalize ? arg.replace(/\//g, '\\') : arg;
        // Always wrap in single quotes for PowerShell
        return `'${normalized.replace(/'/g, "''")}'`;
      });

      // Build PowerShell command - use & operator for paths with spaces
      const psCommand = `& '${normalizedCommand.replace(/'/g, "''")}' ${quotedArgs.join(' ')}`;
      this.logger.debug(`Running (PowerShell): ${psCommand}`);

      // Use PowerShell for better path handling
      const proc = spawn('powershell.exe', ['-NoProfile', '-Command', psCommand], {
        windowsHide: true,
      });

      proc.stdout.on('data', (data) => {
        const output = data.toString();
        this.logger.debug(output);
        if (onOutput) {
          onOutput(output);
        }
      });

      proc.stderr.on('data', (data) => {
        const output = data.toString();
        // ffmpeg outputs progress to stderr
        this.logger.debug(output);
        if (onOutput) {
          onOutput(output);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Cleanup temporary files for a job
   */
  async cleanup(jobDir: string): Promise<void> {
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
      this.logger.log(`Cleaned up job directory: ${jobDir}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup ${jobDir}:`, error);
    }
  }
}
