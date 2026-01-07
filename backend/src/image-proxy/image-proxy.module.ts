import { Module } from '@nestjs/common';
import { ImageProxyController } from './image-proxy.controller';
import { ImageProxyService } from './image-proxy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImageProxyController],
  providers: [ImageProxyService],
  exports: [ImageProxyService],
})
export class ImageProxyModule {}
