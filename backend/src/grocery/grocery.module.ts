import { Module } from '@nestjs/common';
import { GroceryController } from './grocery.controller';
import { GroceryService } from './grocery.service';
import { KrogerApiService } from './kroger-api.service';
import { OpenFoodFactsApiService } from './openfoodfacts-api.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GroceryController],
  providers: [GroceryService, KrogerApiService, OpenFoodFactsApiService],
  exports: [GroceryService, KrogerApiService, OpenFoodFactsApiService],
})
export class GroceryModule {}
