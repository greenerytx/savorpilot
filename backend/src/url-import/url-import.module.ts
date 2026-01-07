import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { UrlImportController } from './url-import.controller';
import { UrlImportService } from './url-import.service';
import { SourceDetectorService } from './source-detector.service';
import { SchemaOrgExtractor } from './extractors/schema-org.extractor';
import { MicrodataExtractor } from './extractors/microdata.extractor';
import { HeuristicsExtractor } from './extractors/heuristics.extractor';

/**
 * URL Import Module
 *
 * Provides multi-tier recipe extraction from various URL sources:
 * - Recipe websites (Schema.org, Microdata, Heuristics, AI fallback)
 * - Instagram posts
 * - Facebook posts
 * - YouTube videos
 * - TikTok videos
 * - PDF documents
 *
 * Optimized for cost savings by trying free extraction methods first.
 */
@Module({
  imports: [PrismaModule, AiModule],
  controllers: [UrlImportController],
  providers: [
    UrlImportService,
    SourceDetectorService,
    SchemaOrgExtractor,
    MicrodataExtractor,
    HeuristicsExtractor,
    // Future extractors:
    // FacebookExtractor,
    // PdfExtractor,
  ],
  exports: [UrlImportService, SourceDetectorService],
})
export class UrlImportModule {}
