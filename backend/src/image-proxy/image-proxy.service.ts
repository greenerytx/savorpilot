import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class ImageProxyService {
  private readonly logger = new Logger(ImageProxyService.name);
  private readonly imagesDir = path.join(process.cwd(), 'uploads', 'images');
  private readonly videosDir = path.join(process.cwd(), 'uploads', 'videos');

  constructor(private readonly prisma: PrismaService) {
    // Ensure uploads directories exist
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
    if (!fs.existsSync(this.videosDir)) {
      fs.mkdirSync(this.videosDir, { recursive: true });
    }
  }

  private isAllowedDomain(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      // Instagram CDN uses hostnames like scontent-hou1-1.cdninstagram.com
      // So we check if it contains these patterns
      const allowedPatterns = [
        'cdninstagram.com',
        'instagram.com',
        'fbcdn.net', // Facebook CDN also used by Instagram
        'ytimg.com', // YouTube thumbnails
        'youtube.com',
        'googlevideo.com', // YouTube video CDN
        'ggpht.com', // Google profile pictures
        'unsplash.com', // Unsplash images
        'images.unsplash.com', // Unsplash CDN
      ];

      return allowedPatterns.some(
        (pattern) => parsedUrl.hostname.includes(pattern),
      );
    } catch {
      return false;
    }
  }

  async fetchImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    // Decode HTML entities that might be in the URL
    const decodedUrl = url
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    console.log('Fetching image from:', decodedUrl.substring(0, 100) + '...');

    if (!this.isAllowedDomain(decodedUrl)) {
      console.error('Domain not allowed:', new URL(decodedUrl).hostname);
      throw new HttpException('Domain not allowed', HttpStatus.FORBIDDEN);
    }

    let response: Response;
    try {
      response = await fetch(decodedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://www.instagram.com/',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        console.error('Fetch failed with status:', response.status, response.statusText);
        throw new HttpException(`Failed to fetch image: ${response.status}`, HttpStatus.BAD_GATEWAY);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { buffer, contentType };
  }

  async downloadAndStoreImage(
    url: string,
    recipeId: string,
    userId: string,
  ): Promise<{ imageUrl: string }> {
    // Verify user owns the recipe
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    // Fetch the image
    const { buffer, contentType } = await this.fetchImage(url);

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const ext = extMap[contentType] || '.jpg';

    // Generate unique filename
    const filename = `${recipeId}-${randomUUID()}${ext}`;
    const filepath = path.join(this.imagesDir, filename);

    // Save to disk
    fs.writeFileSync(filepath, buffer);

    // Generate the local URL
    const localImageUrl = `/uploads/images/${filename}`;

    // Update recipe with new image URL
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { imageUrl: localImageUrl },
    });

    return { imageUrl: localImageUrl };
  }

  /**
   * Fetch video from Instagram URL
   */
  async fetchVideo(url: string): Promise<{ buffer: Buffer; contentType: string }> {
    const decodedUrl = url
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    this.logger.log(`Fetching video from: ${decodedUrl.substring(0, 100)}...`);

    if (!this.isAllowedDomain(decodedUrl)) {
      this.logger.error('Domain not allowed:', new URL(decodedUrl).hostname);
      throw new HttpException('Domain not allowed', HttpStatus.FORBIDDEN);
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'video/mp4,video/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.instagram.com/',
      },
    });

    if (!response.ok) {
      this.logger.error('Video fetch failed:', response.status, response.statusText);
      throw new HttpException(`Failed to fetch video: ${response.status}`, HttpStatus.BAD_GATEWAY);
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    this.logger.log(`Fetched video: ${buffer.length} bytes, type: ${contentType}`);
    return { buffer, contentType };
  }

  /**
   * Fetch fresh video URL from Instagram post
   */
  async fetchFreshVideoUrl(shortcodeOrUrl: string): Promise<string | null> {
    let shortcode = shortcodeOrUrl;

    // Extract shortcode from URL if needed
    if (shortcodeOrUrl.includes('instagram.com')) {
      const match = shortcodeOrUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
      if (match) {
        shortcode = match[2];
      }
    }

    this.logger.log(`Fetching fresh video URL for shortcode: ${shortcode}`);

    try {
      // Try to fetch the Instagram post page and extract video URL
      const postUrl = `https://www.instagram.com/p/${shortcode}/`;
      const response = await fetch(postUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch Instagram post: ${response.status}`);
        return null;
      }

      const html = await response.text();

      // Try to extract video URL from og:video meta tag
      const videoMatch = html.match(/<meta[^>]*property="og:video(?::url)?"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:video(?::url)?"/i);

      if (videoMatch) {
        const videoUrl = videoMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/\\u0026/g, '&');
        this.logger.log(`Found video URL from meta tag`);
        return videoUrl;
      }

      // Try to find video URL in JSON data
      const jsonMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
      if (jsonMatch) {
        const videoUrl = jsonMatch[1]
          .replace(/\\u0026/g, '&')
          .replace(/\\\//g, '/');
        this.logger.log(`Found video URL from JSON`);
        return videoUrl;
      }

      this.logger.warn('No video URL found in Instagram page');
      return null;
    } catch (error) {
      this.logger.error('Error fetching fresh video URL:', error);
      return null;
    }
  }

  /**
   * Download video and store locally
   */
  /**
   * Store an uploaded image file
   */
  async storeUploadedImage(
    file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    // Determine file extension from mimetype
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const ext = extMap[file.mimetype] || '.jpg';

    // Generate unique filename
    const filename = `upload-${randomUUID()}${ext}`;
    const filepath = path.join(this.imagesDir, filename);

    // Save to disk
    fs.writeFileSync(filepath, file.buffer);
    this.logger.log(`Saved uploaded image to: ${filepath} (${file.size} bytes)`);

    // Return the local URL
    return { imageUrl: `/uploads/images/${filename}` };
  }

  async downloadAndStoreVideo(
    recipeId: string,
    userId: string,
  ): Promise<{ videoUrl: string }> {
    // Get the recipe
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new HttpException('Recipe not found', HttpStatus.NOT_FOUND);
    }

    if (!recipe.sourceUrl) {
      throw new HttpException('Recipe has no source URL to fetch video from', HttpStatus.BAD_REQUEST);
    }

    // First try to get fresh video URL from Instagram
    let videoUrl = await this.fetchFreshVideoUrl(recipe.sourceUrl);

    // If that fails and we have an existing videoUrl, try using it
    if (!videoUrl && recipe.videoUrl && recipe.videoUrl.startsWith('http')) {
      videoUrl = recipe.videoUrl;
    }

    if (!videoUrl) {
      throw new HttpException('Could not find video URL for this recipe', HttpStatus.NOT_FOUND);
    }

    // Fetch the video
    const { buffer, contentType } = await this.fetchVideo(videoUrl);

    // Determine file extension
    const extMap: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    };
    const ext = extMap[contentType] || '.mp4';

    // Generate unique filename
    const filename = `${recipeId}-${randomUUID()}${ext}`;
    const filepath = path.join(this.videosDir, filename);

    // Save to disk
    fs.writeFileSync(filepath, buffer);
    this.logger.log(`Saved video to: ${filepath} (${buffer.length} bytes)`);

    // Generate the local URL
    const localVideoUrl = `/uploads/videos/${filename}`;

    // Update recipe with new video URL
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { videoUrl: localVideoUrl },
    });

    return { videoUrl: localVideoUrl };
  }
}
