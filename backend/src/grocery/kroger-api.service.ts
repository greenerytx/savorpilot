import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface KrogerToken {
  accessToken: string;
  expiresAt: number;
}

interface KrogerLocation {
  locationId: string;
  chain: string;
  name: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  geolocation: {
    latitude: number;
    longitude: number;
  };
}

interface KrogerProduct {
  productId: string;
  upc: string;
  brand: string;
  description: string;
  images: Array<{
    perspective: string;
    sizes: Array<{ size: string; url: string }>;
  }>;
  items: Array<{
    itemId: string;
    price?: {
      regular: number;
      promo?: number;
    };
    inventory?: {
      stockLevel: string;
    };
  }>;
  aisleLocations?: Array<{
    bayNumber: string;
    description: string;
    number: string;
    numberOfFacings: number;
    side: string;
    shelfNumber: string;
    shelfPositionInBay: string;
  }>;
  categories: string[];
}

export interface KrogerStoreResult {
  locationId: string;
  name: string;
  chain: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface KrogerProductResult {
  productId: string;
  upc: string;
  name: string;
  brand: string;
  description: string;
  imageUrl?: string;
  category?: string;
  regularPrice?: number;
  salePrice?: number;
  inStock: boolean;
  aisle?: string;
  aisleDescription?: string;
}

@Injectable()
export class KrogerApiService {
  private readonly logger = new Logger(KrogerApiService.name);
  private readonly baseUrl = 'https://api.kroger.com/v1';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private token: KrogerToken | null = null;

  // Kroger family chains
  private readonly krogerChains = [
    'KROGER', 'RALPHS', 'FRED MEYER', 'FRYS', 'SMITHS', 'KING SOOPERS',
    'QFC', 'CITY MARKET', 'DILLONS', 'MARIANOS', 'PICK N SAVE', 'METRO MARKET',
    'HARRIS TEETER', 'FOOD 4 LESS', 'FOODS CO', 'BAKERS', 'GERBES', 'JAY C',
    'OWENS', 'PAY LESS', 'RULER FOODS',
  ];

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('KROGER_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('KROGER_CLIENT_SECRET') || '';
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  isKrogerChain(chainName: string): boolean {
    return this.krogerChains.some(
      (chain) => chainName.toUpperCase().includes(chain)
    );
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.token.expiresAt - 60000) {
      return this.token.accessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('Kroger API credentials not configured');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=product.compact',
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get Kroger access token: ${error}`);
      throw new Error('Failed to authenticate with Kroger API');
    }

    const data = await response.json();
    this.token = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return this.token.accessToken;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Kroger API error: ${response.status} - ${error}`);
      throw new Error(`Kroger API request failed: ${response.status}`);
    }

    return response.json();
  }

  async searchLocations(params: {
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    radiusMiles?: number;
    limit?: number;
  }): Promise<KrogerStoreResult[]> {
    if (!this.isConfigured()) {
      this.logger.warn('Kroger API not configured, skipping location search');
      return [];
    }

    try {
      const queryParams: Record<string, string> = {};

      if (params.zipCode) {
        queryParams['filter.zipCode.near'] = params.zipCode;
      } else if (params.latitude && params.longitude) {
        queryParams['filter.lat.near'] = params.latitude.toString();
        queryParams['filter.lon.near'] = params.longitude.toString();
      }

      if (params.radiusMiles) {
        queryParams['filter.radiusInMiles'] = params.radiusMiles.toString();
      }

      queryParams['filter.limit'] = (params.limit || 10).toString();

      const response = await this.makeRequest<{ data: KrogerLocation[] }>(
        '/locations',
        queryParams
      );

      return response.data.map((loc) => ({
        locationId: loc.locationId,
        name: loc.name,
        chain: loc.chain,
        address: loc.address.addressLine1,
        city: loc.address.city,
        state: loc.address.state,
        zipCode: loc.address.zipCode,
        latitude: loc.geolocation.latitude,
        longitude: loc.geolocation.longitude,
      }));
    } catch (error) {
      this.logger.error('Failed to search Kroger locations', error);
      return [];
    }
  }

  async searchProducts(params: {
    query: string;
    locationId?: string;
    limit?: number;
  }): Promise<KrogerProductResult[]> {
    if (!this.isConfigured()) {
      this.logger.warn('Kroger API not configured, skipping product search');
      return [];
    }

    try {
      const queryParams: Record<string, string> = {
        'filter.term': params.query,
        'filter.limit': (params.limit || 20).toString(),
      };

      if (params.locationId) {
        queryParams['filter.locationId'] = params.locationId;
      }

      const response = await this.makeRequest<{ data: KrogerProduct[] }>(
        '/products',
        queryParams
      );

      return response.data.map((product) => this.mapKrogerProduct(product));
    } catch (error) {
      this.logger.error('Failed to search Kroger products', error);
      return [];
    }
  }

  async getProductByUpc(upc: string, locationId?: string): Promise<KrogerProductResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const queryParams: Record<string, string> = {
        'filter.productId': upc,
      };

      if (locationId) {
        queryParams['filter.locationId'] = locationId;
      }

      const response = await this.makeRequest<{ data: KrogerProduct[] }>(
        '/products',
        queryParams
      );

      if (response.data.length === 0) {
        return null;
      }

      return this.mapKrogerProduct(response.data[0]);
    } catch (error) {
      this.logger.error(`Failed to get Kroger product by UPC: ${upc}`, error);
      return null;
    }
  }

  async getProductPrices(
    productIds: string[],
    locationId: string
  ): Promise<Map<string, { regularPrice: number; salePrice?: number; inStock: boolean }>> {
    if (!this.isConfigured()) {
      return new Map();
    }

    const priceMap = new Map<string, { regularPrice: number; salePrice?: number; inStock: boolean }>();

    try {
      // Kroger API allows up to 50 products per request
      const batches = this.chunkArray(productIds, 50);

      for (const batch of batches) {
        const queryParams: Record<string, string> = {
          'filter.productId': batch.join(','),
          'filter.locationId': locationId,
        };

        const response = await this.makeRequest<{ data: KrogerProduct[] }>(
          '/products',
          queryParams
        );

        for (const product of response.data) {
          const item = product.items?.[0];
          if (item?.price) {
            priceMap.set(product.productId, {
              regularPrice: item.price.regular,
              salePrice: item.price.promo,
              inStock: item.inventory?.stockLevel !== 'TEMPORARILY_OUT_OF_STOCK',
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to get Kroger product prices', error);
    }

    return priceMap;
  }

  private mapKrogerProduct(product: KrogerProduct): KrogerProductResult {
    const item = product.items?.[0];
    const image = product.images?.find((img) => img.perspective === 'front');
    const largeImage = image?.sizes?.find((s) => s.size === 'large' || s.size === 'xlarge');

    let aisle: string | undefined;
    let aisleDescription: string | undefined;

    if (product.aisleLocations?.length) {
      const loc = product.aisleLocations[0];
      aisle = `Aisle ${loc.number}`;
      aisleDescription = loc.description;
    }

    return {
      productId: product.productId,
      upc: product.upc,
      name: product.description,
      brand: product.brand,
      description: product.description,
      imageUrl: largeImage?.url,
      category: product.categories?.[0],
      regularPrice: item?.price?.regular,
      salePrice: item?.price?.promo,
      inStock: item?.inventory?.stockLevel !== 'TEMPORARILY_OUT_OF_STOCK',
      aisle,
      aisleDescription,
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
