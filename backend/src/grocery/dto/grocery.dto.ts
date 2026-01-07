import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Request DTOs ====================

export class SearchProductsDto {
  @ApiProperty({ description: 'Search query for products' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Store ID to get prices from' })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Limit results', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SearchStoresDto {
  @ApiPropertyOptional({ description: 'ZIP code to search near' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Latitude for location search' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for location search' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Search radius in miles', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  radiusMiles?: number;

  @ApiPropertyOptional({ description: 'Filter by chain name' })
  @IsOptional()
  @IsString()
  chain?: string;
}

export class ScanBarcodeDto {
  @ApiProperty({ description: 'Product barcode (UPC/EAN)' })
  @IsString()
  barcode: string;

  @ApiPropertyOptional({ description: 'Store ID to get price from' })
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class SetPreferredStoreDto {
  @ApiProperty({ description: 'Store ID to set as preferred' })
  @IsString()
  storeId: string;

  @ApiPropertyOptional({ description: 'Set as primary store', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ReportAisleDto {
  @ApiProperty({ description: 'Store ID' })
  @IsString()
  storeId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  productName: string;

  @ApiProperty({ description: 'Aisle location (e.g., "Aisle 5")' })
  @IsString()
  aisle: string;

  @ApiPropertyOptional({ description: 'Section within aisle' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Product ID if known' })
  @IsOptional()
  @IsString()
  productId?: string;
}

export class GetProductPricesDto {
  @ApiProperty({ description: 'Product IDs to get prices for' })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @ApiPropertyOptional({ description: 'Store ID to get prices from' })
  @IsOptional()
  @IsString()
  storeId?: string;
}

// ==================== Response DTOs ====================

export class ProductPriceResponse {
  @ApiProperty()
  regularPrice: number;

  @ApiPropertyOptional()
  salePrice?: number;

  @ApiPropertyOptional()
  pricePerUnit?: number;

  @ApiPropertyOptional()
  unitOfMeasure?: string;

  @ApiProperty()
  inStock: boolean;

  @ApiProperty()
  lastChecked: Date;
}

export class ProductResponse {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  upc?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  brand?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  size?: string;

  @ApiPropertyOptional()
  nutritionGrade?: string;

  @ApiPropertyOptional()
  price?: ProductPriceResponse;

  @ApiPropertyOptional()
  aisle?: string;
}

export class StoreResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  chain: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiProperty()
  isKrogerFamily: boolean;

  @ApiPropertyOptional()
  distance?: number;
}

export class AisleInfoResponse {
  @ApiProperty()
  aisle: string;

  @ApiPropertyOptional()
  section?: string;

  @ApiProperty()
  source: 'KROGER_API' | 'USER' | 'HEURISTIC';

  @ApiPropertyOptional()
  confidence?: number;
}

export class ProductSearchResponse {
  @ApiProperty({ type: [ProductResponse] })
  products: ProductResponse[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  source?: 'kroger' | 'openfoodfacts' | 'cache';
}

export class StoreSearchResponse {
  @ApiProperty({ type: [StoreResponse] })
  stores: StoreResponse[];

  @ApiProperty()
  total: number;
}

export class BarcodeResponse {
  @ApiProperty()
  found: boolean;

  @ApiPropertyOptional({ type: ProductResponse })
  product?: ProductResponse;

  @ApiPropertyOptional()
  source?: 'openfoodfacts' | 'kroger' | 'cache';
}
