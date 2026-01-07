import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

@ApiTags('Extension')
@Controller('extension')
export class ExtensionController {
  private readonly logger = new Logger(ExtensionController.name);

  /**
   * Get the extension directory path
   */
  private getExtensionDir(): string {
    // Try multiple possible paths (works for both Windows and Linux/WSL)
    const cwd = process.cwd();

    const possiblePaths = [
      path.join(cwd, '..', 'extension'),
      path.join(cwd, 'extension'),
      path.resolve(__dirname, '..', '..', '..', '..', 'extension'),
      path.resolve(__dirname, '..', '..', '..', 'extension'),
      // Windows-specific paths
      'C:\\Users\\hammo\\Documents\\Code Playground\\GramGRab\\extension',
      'C:/Users/hammo/Documents/Code Playground/GramGRab/extension',
    ];

    this.logger.log(`Current working directory: ${cwd}`);
    this.logger.log(`__dirname: ${__dirname}`);

    for (const p of possiblePaths) {
      try {
        const normalizedPath = path.normalize(p);
        this.logger.debug(`Checking path: ${normalizedPath}`);
        if (fs.existsSync(normalizedPath)) {
          const manifestPath = path.join(normalizedPath, 'manifest.json');
          if (fs.existsSync(manifestPath)) {
            this.logger.log(`Found extension at: ${normalizedPath}`);
            return normalizedPath;
          }
        }
      } catch (err) {
        this.logger.debug(`Error checking path ${p}: ${err}`);
      }
    }

    this.logger.error(`Extension not found. CWD: ${cwd}, Checked paths: ${possiblePaths.length}`);
    return '';
  }

  /**
   * Download Chrome extension as ZIP file
   * GET /api/extension/download
   */
  @Public()
  @Get('download')
  @ApiOperation({
    summary: 'Download Chrome extension',
    description: 'Downloads the GramGrab Chrome extension as a ZIP file',
  })
  @ApiResponse({
    status: 200,
    description: 'Extension ZIP file',
  })
  @ApiResponse({
    status: 404,
    description: 'Extension files not found',
  })
  async downloadExtension(@Res() res: Response) {
    const extensionDir = this.getExtensionDir();

    if (!extensionDir) {
      this.logger.error('Extension directory not found');
      return res.status(HttpStatus.NOT_FOUND).json({
        statusCode: 404,
        message: 'Extension files not found. Please contact support.',
      });
    }

    try {
      // Files to include in the ZIP
      const filesToInclude = [
        'manifest.json',
        'popup.html',
        'popup.css',
        'popup.js',
        'background.js',
        'content.js',
        'README.md',
      ];

      // Verify files exist
      const existingFiles: string[] = [];
      for (const file of filesToInclude) {
        const filePath = path.join(extensionDir, file);
        if (fs.existsSync(filePath)) {
          existingFiles.push(file);
          this.logger.debug(`Found file: ${file}`);
        } else {
          this.logger.warn(`File not found: ${filePath}`);
        }
      }

      if (existingFiles.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: 404,
          message: 'No extension files found',
        });
      }

      this.logger.log(`Creating ZIP with ${existingFiles.length} files`);

      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      // Handle archive errors
      archive.on('error', (err: Error) => {
        this.logger.error('Archive error:', err);
        if (!res.headersSent) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: 500,
            message: 'Failed to create archive',
          });
        }
      });

      // Handle archive warnings
      archive.on('warning', (err: Error & { code?: string }) => {
        if (err.code === 'ENOENT') {
          this.logger.warn('Archive warning:', err);
        } else {
          throw err;
        }
      });

      // Set response headers before piping
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="gramgrab-extension.zip"',
        'Cache-Control': 'no-cache',
      });

      // Pipe archive to response
      archive.pipe(res);

      // Add files to archive
      for (const file of existingFiles) {
        const filePath = path.join(extensionDir, file);
        archive.file(filePath, { name: file });
      }

      // Add icons directory if exists
      const iconsDir = path.join(extensionDir, 'icons');
      if (fs.existsSync(iconsDir)) {
        const iconFiles = fs.readdirSync(iconsDir);
        this.logger.debug(`Adding ${iconFiles.length} icon files`);
        archive.directory(iconsDir, 'icons');
      }

      // Finalize and wait for completion
      await archive.finalize();

      this.logger.log(`Extension download completed. Archive size: ${archive.pointer()} bytes`);
    } catch (error) {
      this.logger.error('Failed to create extension archive:', error);
      if (!res.headersSent) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: 500,
          message: 'Failed to create extension package',
        });
      }
    }
  }

  /**
   * Get extension info
   * GET /api/extension/info
   */
  @Public()
  @Get('info')
  @ApiOperation({
    summary: 'Get extension information',
    description: 'Returns information about the Chrome extension',
  })
  @ApiResponse({
    status: 200,
    description: 'Extension information',
  })
  async getExtensionInfo() {
    try {
      const extensionDir = this.getExtensionDir();

      if (!extensionDir) {
        return {
          name: 'GramGrab Extension',
          version: '1.0.0',
          description: 'Sync your saved Instagram posts to GramGrab',
          available: false,
        };
      }

      const manifestPath = path.join(extensionDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        available: true,
      };
    } catch (error) {
      this.logger.error('Failed to get extension info', error);
      return {
        name: 'GramGrab Extension',
        version: '1.0.0',
        description: 'Sync your saved Instagram posts to GramGrab',
        available: false,
      };
    }
  }

  /**
   * Debug endpoint to check extension path
   * GET /api/extension/debug
   */
  @Public()
  @Get('debug')
  @ApiOperation({
    summary: 'Debug extension paths',
    description: 'Returns debug information about extension paths',
  })
  async debugPaths() {
    const cwd = process.cwd();
    const dirname = __dirname;

    const possiblePaths = [
      path.join(cwd, '..', 'extension'),
      path.join(cwd, 'extension'),
      path.resolve(dirname, '..', '..', '..', '..', 'extension'),
      path.resolve(dirname, '..', '..', '..', 'extension'),
      'C:\\Users\\hammo\\Documents\\Code Playground\\GramGRab\\extension',
      'C:/Users/hammo/Documents/Code Playground/GramGRab/extension',
    ];

    const results = possiblePaths.map(p => {
      try {
        const normalized = path.normalize(p);
        const exists = fs.existsSync(normalized);
        const manifestPath = path.join(normalized, 'manifest.json');
        const hasManifest = exists && fs.existsSync(manifestPath);
        let files: string[] = [];
        if (exists) {
          try {
            files = fs.readdirSync(normalized);
          } catch (e) {
            // Ignore
          }
        }
        return {
          path: p,
          normalized,
          exists,
          hasManifest,
          files,
        };
      } catch (e) {
        return {
          path: p,
          error: String(e),
        };
      }
    });

    const foundDir = this.getExtensionDir();

    return {
      cwd,
      dirname,
      platform: process.platform,
      paths: results,
      foundDir: foundDir || 'NOT FOUND',
    };
  }
}
