import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { OcrFrameResult, FrameAnalysis, VideoMetadata } from './types';
import { ExtractedRecipeDto } from './dto';

/**
 * Service for AI-powered recipe extraction:
 * - OpenAI Whisper API for audio transcription
 * - GPT-4o Vision for frame analysis
 * - GPT-4o-mini for recipe synthesis
 */
@Injectable()
export class YouTubeAiService {
  private readonly logger = new Logger(YouTubeAiService.name);
  private readonly apiKey: string;
  private readonly maxFramesToAnalyze: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('OPENAI_API_KEY') || '';
    this.maxFramesToAnalyze = parseInt(
      this.configService.get('YOUTUBE_MAX_FRAMES') || '20',
      10,
    );
  }

  /**
   * Transcribe audio using OpenAI Whisper API with retry logic
   */
  async transcribeAudio(audioPath: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const audioBuffer = await fs.readFile(audioPath);
    const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);
    this.logger.log(`Transcribing audio with Whisper (${fileSizeMB} MB)...`);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const formData = new FormData();
        formData.append(
          'file',
          new Blob([audioBuffer], { type: 'audio/mp3' }),
          'audio.mp3',
        );
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'text');

        const response = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(`Whisper API error: ${response.status} - ${errorText}`);
          throw new Error(`Whisper API error: ${response.status}`);
        }

        const transcription = await response.text();
        this.logger.log(
          `Transcription complete: ${transcription.length} characters`,
        );

        return transcription;
      } catch (error) {
        lastError = error as Error;
        const isRetryable =
          error instanceof Error &&
          (error.message.includes('ECONNRESET') ||
            error.message.includes('fetch failed') ||
            error.message.includes('network') ||
            error.cause?.toString().includes('ECONNRESET'));

        if (isRetryable && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          this.logger.warn(
            `Whisper API connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay / 1000}s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError || new Error('Transcription failed after retries');
  }

  /**
   * Analyze frames with text using GPT-4o Vision
   * Only analyzes frames that passed OCR pre-filter
   */
  async analyzeFramesWithVision(
    framesWithText: OcrFrameResult[],
  ): Promise<FrameAnalysis[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Select evenly distributed frames to analyze
    const selectedFrames = this.selectEvenlyDistributed(
      framesWithText,
      this.maxFramesToAnalyze,
    );

    this.logger.log(
      `Analyzing ${selectedFrames.length} frames with GPT-4o Vision...`,
    );

    const analyses: FrameAnalysis[] = [];

    for (const frame of selectedFrames) {
      try {
        const analysis = await this.analyzeFrame(frame);
        analyses.push(analysis);
      } catch (error) {
        this.logger.warn(
          `Failed to analyze frame at ${frame.timestamp}s:`,
          error,
        );
      }
    }

    this.logger.log(`Analyzed ${analyses.length} frames successfully`);
    return analyses;
  }

  /**
   * Analyze a single frame with GPT-4o Vision
   */
  private async analyzeFrame(frame: OcrFrameResult): Promise<FrameAnalysis> {
    const imageBuffer = await fs.readFile(frame.framePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are extracting recipe information from a video frame.
Extract any visible text that could be recipe-related:
- Ingredient lists with quantities (numbers, units, ingredient names)
- Step numbers or instructions
- Cooking times or temperatures
- Measurements in any language

Return ONLY valid JSON with this structure (no markdown, no explanation):
{"ingredients": [{"quantity": number, "unit": "string", "name": "string"}], "steps": [{"instruction": "string", "duration": number}], "otherText": "string"}

If no recipe information is visible, return: {"ingredients": [], "steps": [], "otherText": ""}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              {
                type: 'text',
                text: `OCR detected this text: "${frame.ocrText}". Extract recipe information from the image.`,
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-4o Vision error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Parse the JSON response
    let analysis;
    try {
      // Clean up markdown if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysis = JSON.parse(cleanContent);
    } catch {
      this.logger.warn(`Failed to parse frame analysis: ${content}`);
      analysis = { ingredients: [], steps: [], otherText: '' };
    }

    return {
      timestamp: frame.timestamp,
      analysis,
    };
  }

  /**
   * Synthesize recipes from transcription and frame analyses
   * Returns an array as videos may contain multiple recipes
   */
  async synthesizeRecipes(
    transcription: string,
    frameAnalyses: FrameAnalysis[],
    videoMetadata: VideoMetadata,
  ): Promise<ExtractedRecipeDto[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.logger.log('Synthesizing recipes from transcription and frame data...');

    // Format frame analysis data
    const frameContext = frameAnalyses
      .filter(
        (f) =>
          f.analysis.ingredients?.length ||
          f.analysis.steps?.length ||
          f.analysis.otherText,
      )
      .map(
        (f) =>
          `[${Math.floor(f.timestamp / 60)}:${String(f.timestamp % 60).padStart(2, '0')}]: ${JSON.stringify(f.analysis)}`,
      )
      .join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional recipe extractor. Synthesize recipes from these sources (in order of priority):
1. VIDEO DESCRIPTION (notes under video) - Often contains the COMPLETE recipe with exact measurements
2. Visual frame analysis (on-screen text, ingredient lists, measurements)
3. Audio transcription (spoken instructions from the chef)

CRITICAL: Many cooking channels put the FULL RECIPE in the video description. Check it FIRST as it's often the most accurate source with precise measurements.

CRITICAL: Videos may contain MULTIPLE distinct recipes. Identify and extract each one separately.
Examples of multiple recipes:
- "3 Easy Pasta Recipes" → 3 separate recipes
- "Chicken 2 Ways" → 2 recipes (one for each method)
- "Basic Cake + Frosting" → 1 recipe (components of same dish)

IMPORTANT RULES:
- Check the video DESCRIPTION first - it often contains the complete recipe with exact measurements
- If description has a recipe, use those measurements as the primary source
- Visual ingredient lists are second priority (more accurate than spoken)
- Audio transcription fills in gaps and provides cooking instructions
- Extract ALL ingredients mentioned, with precise quantities when available
- Create clear, numbered cooking steps for EACH recipe
- Variations of the same dish (baked vs fried) = SEPARATE recipes
- Components of one dish (cake + frosting) = ONE recipe with multiple components
- Detect the language and translate if needed

Return ONLY valid JSON ARRAY with this EXACT structure (no markdown, no explanation):
[
  {
    "title": "Recipe name",
    "description": "Brief 1-2 sentence description",
    "prepTimeMinutes": number or null,
    "cookTimeMinutes": number or null,
    "servings": number or null,
    "difficulty": "EASY" or "MEDIUM" or "HARD" or "EXPERT" or null,
    "category": "BREAKFAST" or "LUNCH" or "DINNER" or "DESSERT" or "SNACK" or "APPETIZER" or "SIDE_DISH" or "MAIN_COURSE" or "SOUP" or "SALAD" or "BREAD" or "BAKING" or "BEVERAGE" or null,
    "cuisine": "Cuisine type" or null,
    "tags": ["array", "of", "relevant", "tags"],
    "components": [
      {
        "name": "Main" or component name,
        "ingredients": [
          {"quantity": number or null, "unit": "string or null", "name": "ingredient name", "notes": "optional notes", "optional": false}
        ],
        "steps": [
          {"order": 1, "instruction": "Step instruction", "duration": minutes or null, "tips": "optional tip"}
        ]
      }
    ],
    "confidence": 0.0 to 1.0
  }
]

Always return an ARRAY, even if there's only one recipe: [{ recipe }]`,
          },
          {
            role: 'user',
            content: `Video: "${videoMetadata.title}" by ${videoMetadata.channel}

VIDEO DESCRIPTION (notes under video - CHECK THIS FIRST for recipe):
${videoMetadata.description ? videoMetadata.description.substring(0, 8000) : 'No description available'}

AUDIO TRANSCRIPTION:
${transcription.substring(0, 10000)}

VISUAL FRAME ANALYSIS (ingredients and measurements shown on screen):
${frameContext.substring(0, 5000)}

Extract ALL complete recipes from this video. Return as a JSON array.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`GPT-4o-mini error: ${response.status} - ${errorText}`);
      throw new Error(`Recipe synthesis error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Parse the JSON response
    let recipes: ExtractedRecipeDto[];
    try {
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleanContent);
      // Ensure it's an array
      recipes = Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      this.logger.error(`Failed to parse recipes: ${content}`);
      throw new Error('Failed to parse extracted recipes');
    }

    // Validate and normalize each recipe
    recipes = recipes.filter((recipe) => recipe.title && recipe.components?.length);

    if (recipes.length === 0) {
      throw new Error('No valid recipes could be extracted');
    }

    // Ensure steps have order numbers
    recipes = recipes.map((recipe) => ({
      ...recipe,
      components: recipe.components.map((component) => ({
        ...component,
        steps: component.steps.map((step, index) => ({
          ...step,
          order: step.order || index + 1,
        })),
      })),
    }));

    this.logger.log(
      `Extracted ${recipes.length} recipe(s): ${recipes.map((r) => r.title).join(', ')}`,
    );

    return recipes;
  }

  /**
   * Select frames evenly distributed across the video
   */
  private selectEvenlyDistributed<T>(
    items: T[],
    maxCount: number,
  ): T[] {
    if (items.length <= maxCount) {
      return items;
    }

    const result: T[] = [];
    const step = items.length / maxCount;

    for (let i = 0; i < maxCount; i++) {
      const index = Math.floor(i * step);
      result.push(items[index]);
    }

    return result;
  }
}
