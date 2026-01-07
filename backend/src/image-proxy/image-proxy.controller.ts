import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ImageProxyService } from './image-proxy.service';
import { DownloadImageDto } from './dto/download-image.dto';

@Controller('image-proxy')
export class ImageProxyController {
  constructor(private readonly imageProxyService: ImageProxyService) {}

  @Get()
  @Public()
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { buffer, contentType } =
        await this.imageProxyService.fetchImage(url);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Image proxy error:', error);
      throw new HttpException(
        'Failed to proxy image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('download')
  async downloadAndStore(
    @Body() body: DownloadImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.imageProxyService.downloadAndStoreImage(
      body.url,
      body.recipeId,
      userId,
    );
  }

  @Post('download-video')
  async downloadAndStoreVideo(
    @Body() body: { recipeId: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.imageProxyService.downloadAndStoreVideo(
      body.recipeId,
      userId,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.imageProxyService.storeUploadedImage(file);
  }
}
