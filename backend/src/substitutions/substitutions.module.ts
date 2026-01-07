import { Module } from '@nestjs/common';
import { SubstitutionsController } from './substitutions.controller';
import { SubstitutionsService } from './substitutions.service';

@Module({
  controllers: [SubstitutionsController],
  providers: [SubstitutionsService],
  exports: [SubstitutionsService],
})
export class SubstitutionsModule {}
