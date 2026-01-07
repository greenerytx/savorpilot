import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroceryService } from './grocery.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  SearchProductsDto,
  SearchStoresDto,
  ScanBarcodeDto,
  SetPreferredStoreDto,
  ReportAisleDto,
  ProductSearchResponse,
  StoreSearchResponse,
  StoreResponse,
  BarcodeResponse,
  AisleInfoResponse,
  ProductResponse,
} from './dto';

@ApiTags('Grocery')
@ApiBearerAuth()
@Controller('grocery')
export class GroceryController {
  constructor(private readonly groceryService: GroceryService) {}

  @Get('products/search')
  @ApiOperation({ summary: 'Search for grocery products' })
  async searchProducts(
    @Query() dto: SearchProductsDto,
  ): Promise<ProductSearchResponse> {
    return this.groceryService.searchProducts(dto);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details with price' })
  async getProduct(
    @Param('id') id: string,
    @Query('storeId') storeId?: string,
  ): Promise<ProductResponse | null> {
    return this.groceryService.getProductWithPrice(id, storeId);
  }

  @Post('products/scan')
  @ApiOperation({ summary: 'Scan product barcode' })
  async scanBarcode(@Body() dto: ScanBarcodeDto): Promise<BarcodeResponse> {
    return this.groceryService.scanBarcode(dto);
  }

  @Get('stores/search')
  @ApiOperation({ summary: 'Search for grocery stores' })
  async searchStores(@Query() dto: SearchStoresDto): Promise<StoreSearchResponse> {
    return this.groceryService.searchStores(dto);
  }

  @Get('stores/preferred')
  @ApiOperation({ summary: 'Get user preferred stores' })
  async getPreferredStores(
    @CurrentUser('id') userId: string,
  ): Promise<StoreResponse[]> {
    return this.groceryService.getUserPreferredStores(userId);
  }

  @Post('stores/preferred')
  @ApiOperation({ summary: 'Set a store as preferred' })
  async setPreferredStore(
    @CurrentUser('id') userId: string,
    @Body() dto: SetPreferredStoreDto,
  ): Promise<void> {
    return this.groceryService.setPreferredStore(
      userId,
      dto.storeId,
      dto.isPrimary ?? false,
    );
  }

  @Delete('stores/preferred/:storeId')
  @ApiOperation({ summary: 'Remove a preferred store' })
  async removePreferredStore(
    @CurrentUser('id') userId: string,
    @Param('storeId') storeId: string,
  ): Promise<void> {
    return this.groceryService.removePreferredStore(userId, storeId);
  }

  @Post('aisle/report')
  @ApiOperation({ summary: 'Report aisle location for a product' })
  async reportAisle(
    @CurrentUser('id') userId: string,
    @Body() dto: ReportAisleDto,
  ): Promise<void> {
    return this.groceryService.reportAisle(userId, dto);
  }

  @Get('aisle/:storeId/:productName')
  @ApiOperation({ summary: 'Get aisle info for a product at a store' })
  async getAisleInfo(
    @Param('storeId') storeId: string,
    @Param('productName') productName: string,
  ): Promise<AisleInfoResponse | null> {
    return this.groceryService.getAisleInfo(storeId, productName);
  }
}
