import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KrogerApiService } from './kroger-api.service';
import { OpenFoodFactsApiService } from './openfoodfacts-api.service';
import {
  SearchProductsDto,
  SearchStoresDto,
  ScanBarcodeDto,
  ReportAisleDto,
  ProductResponse,
  ProductSearchResponse,
  StoreResponse,
  StoreSearchResponse,
  BarcodeResponse,
  AisleInfoResponse,
} from './dto';

@Injectable()
export class GroceryService {
  private readonly logger = new Logger(GroceryService.name);

  constructor(
    private prisma: PrismaService,
    private krogerApi: KrogerApiService,
    private openFoodFactsApi: OpenFoodFactsApiService,
  ) {}

  async searchProducts(dto: SearchProductsDto): Promise<ProductSearchResponse> {
    const { query, storeId, limit = 20 } = dto;

    // Get store info to determine if we should use Kroger API
    let krogerLocationId: string | undefined;
    if (storeId) {
      const store = await this.prisma.groceryStore.findUnique({
        where: { id: storeId },
      });
      if (store?.krogerLocationId) {
        krogerLocationId = store.krogerLocationId;
      }
    }

    // Try Kroger API first if we have a Kroger store
    if (krogerLocationId && this.krogerApi.isConfigured()) {
      const krogerProducts = await this.krogerApi.searchProducts({
        query,
        locationId: krogerLocationId,
        limit,
      });

      if (krogerProducts.length > 0) {
        const products = await this.saveAndMapKrogerProducts(krogerProducts, storeId);
        return {
          products,
          total: products.length,
          source: 'kroger',
        };
      }
    }

    // Fall back to Open Food Facts
    const offProducts = await this.openFoodFactsApi.searchProducts(query, limit);

    if (offProducts.length > 0) {
      const products = await this.saveAndMapOpenFoodFactsProducts(offProducts);
      return {
        products,
        total: products.length,
        source: 'openfoodfacts',
      };
    }

    // Check local cache
    const cachedProducts = await this.prisma.groceryProduct.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });

    return {
      products: cachedProducts.map((p) => this.mapDbProduct(p)),
      total: cachedProducts.length,
      source: 'cache',
    };
  }

  async scanBarcode(dto: ScanBarcodeDto): Promise<BarcodeResponse> {
    const { barcode, storeId } = dto;

    // Check local cache first
    const cached = await this.prisma.groceryProduct.findUnique({
      where: { upc: barcode },
      include: {
        prices: storeId
          ? { where: { storeId }, take: 1 }
          : { take: 1 },
      },
    });

    if (cached) {
      return {
        found: true,
        product: this.mapDbProduct(cached, cached.prices[0]),
        source: 'cache',
      };
    }

    // Try Open Food Facts (best for barcode lookups)
    const offProduct = await this.openFoodFactsApi.getProductByBarcode(barcode);

    if (offProduct) {
      const saved = await this.prisma.groceryProduct.upsert({
        where: { upc: barcode },
        create: {
          upc: barcode,
          name: offProduct.name,
          brand: offProduct.brand,
          description: offProduct.description,
          category: offProduct.category,
          imageUrl: offProduct.imageUrl,
          size: offProduct.size,
          nutritionGrade: offProduct.nutritionGrade,
          novaGroup: offProduct.novaGroup,
          calories: offProduct.calories,
          fat: offProduct.fat,
          saturatedFat: offProduct.saturatedFat,
          carbohydrates: offProduct.carbohydrates,
          sugars: offProduct.sugars,
          fiber: offProduct.fiber,
          protein: offProduct.protein,
          sodium: offProduct.sodium,
          openFoodFactsId: barcode,
        },
        update: {
          name: offProduct.name,
          brand: offProduct.brand,
          lastUpdated: new Date(),
        },
      });

      return {
        found: true,
        product: this.mapDbProduct(saved),
        source: 'openfoodfacts',
      };
    }

    // Try Kroger API
    if (this.krogerApi.isConfigured()) {
      let krogerLocationId: string | undefined;
      if (storeId) {
        const store = await this.prisma.groceryStore.findUnique({
          where: { id: storeId },
        });
        krogerLocationId = store?.krogerLocationId || undefined;
      }

      const krogerProduct = await this.krogerApi.getProductByUpc(barcode, krogerLocationId);

      if (krogerProduct) {
        const saved = await this.prisma.groceryProduct.upsert({
          where: { upc: barcode },
          create: {
            upc: barcode,
            name: krogerProduct.name,
            brand: krogerProduct.brand,
            description: krogerProduct.description,
            category: krogerProduct.category,
            imageUrl: krogerProduct.imageUrl,
            krogerProductId: krogerProduct.productId,
          },
          update: {
            name: krogerProduct.name,
            brand: krogerProduct.brand,
            lastUpdated: new Date(),
          },
        });

        return {
          found: true,
          product: this.mapDbProduct(saved),
          source: 'kroger',
        };
      }
    }

    return { found: false };
  }

  async searchStores(dto: SearchStoresDto): Promise<StoreSearchResponse> {
    const { zipCode, latitude, longitude, radiusMiles = 10, chain } = dto;

    // Try Kroger API first
    if (this.krogerApi.isConfigured() && (zipCode || (latitude && longitude))) {
      const krogerStores = await this.krogerApi.searchLocations({
        zipCode,
        latitude,
        longitude,
        radiusMiles,
        limit: 20,
      });

      // Save Kroger stores to database
      for (const store of krogerStores) {
        await this.prisma.groceryStore.upsert({
          where: { krogerLocationId: store.locationId },
          create: {
            name: store.name,
            chain: store.chain,
            address: store.address,
            city: store.city,
            state: store.state,
            zipCode: store.zipCode,
            latitude: store.latitude,
            longitude: store.longitude,
            krogerLocationId: store.locationId,
            isKrogerFamily: true,
          },
          update: {
            name: store.name,
            address: store.address,
          },
        });
      }
    }

    // Query local database
    const where: any = {};

    if (chain) {
      where.chain = { contains: chain, mode: 'insensitive' };
    }

    if (zipCode) {
      where.zipCode = zipCode;
    }

    const stores = await this.prisma.groceryStore.findMany({
      where,
      take: 20,
      orderBy: { name: 'asc' },
    });

    // Calculate distances if we have coordinates
    const storesWithDistance = stores.map((store) => {
      let distance: number | undefined;
      if (latitude && longitude && store.latitude && store.longitude) {
        distance = this.calculateDistance(
          latitude,
          longitude,
          store.latitude,
          store.longitude
        );
      }
      return { ...store, distance };
    });

    // Sort by distance if available
    if (latitude && longitude) {
      storesWithDistance.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    return {
      stores: storesWithDistance.map((store) => ({
        id: store.id,
        name: store.name,
        chain: store.chain,
        address: store.address || undefined,
        city: store.city || undefined,
        state: store.state || undefined,
        zipCode: store.zipCode || undefined,
        latitude: store.latitude || undefined,
        longitude: store.longitude || undefined,
        isKrogerFamily: store.isKrogerFamily,
        distance: store.distance,
      })),
      total: storesWithDistance.length,
    };
  }

  async getUserPreferredStores(userId: string): Promise<StoreResponse[]> {
    const preferences = await this.prisma.userStorePreference.findMany({
      where: { userId },
      include: { store: true },
      orderBy: { isPrimary: 'desc' },
    });

    return preferences.map((pref) => ({
      id: pref.store.id,
      name: pref.store.name,
      chain: pref.store.chain,
      address: pref.store.address || undefined,
      city: pref.store.city || undefined,
      state: pref.store.state || undefined,
      zipCode: pref.store.zipCode || undefined,
      latitude: pref.store.latitude || undefined,
      longitude: pref.store.longitude || undefined,
      isKrogerFamily: pref.store.isKrogerFamily,
    }));
  }

  async setPreferredStore(userId: string, storeId: string, isPrimary: boolean): Promise<void> {
    const store = await this.prisma.groceryStore.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // If setting as primary, unset other primary stores
    if (isPrimary) {
      await this.prisma.userStorePreference.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    await this.prisma.userStorePreference.upsert({
      where: {
        userId_storeId: { userId, storeId },
      },
      create: {
        userId,
        storeId,
        isPrimary,
      },
      update: {
        isPrimary,
      },
    });
  }

  async removePreferredStore(userId: string, storeId: string): Promise<void> {
    await this.prisma.userStorePreference.deleteMany({
      where: { userId, storeId },
    });
  }

  async reportAisle(userId: string, dto: ReportAisleDto): Promise<void> {
    await this.prisma.storeAisleData.upsert({
      where: {
        storeId_productName: {
          storeId: dto.storeId,
          productName: dto.productName,
        },
      },
      create: {
        storeId: dto.storeId,
        productId: dto.productId,
        productName: dto.productName,
        category: dto.category || 'other',
        aisle: dto.aisle,
        section: dto.section,
        source: 'USER',
        reportCount: 1,
      },
      update: {
        aisle: dto.aisle,
        section: dto.section,
        reportCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    });
  }

  async getAisleInfo(storeId: string, productName: string): Promise<AisleInfoResponse | null> {
    // Check user-reported data first
    const userData = await this.prisma.storeAisleData.findFirst({
      where: {
        storeId,
        productName: { contains: productName, mode: 'insensitive' },
      },
      orderBy: { reportCount: 'desc' },
    });

    if (userData) {
      return {
        aisle: userData.aisle,
        section: userData.section || undefined,
        source: userData.source as 'KROGER_API' | 'USER' | 'HEURISTIC',
        confidence: Math.min(userData.reportCount / 5, 1),
      };
    }

    // Fall back to category-based heuristic
    const category = this.guessAisleByProductName(productName);
    if (category) {
      return {
        aisle: category,
        source: 'HEURISTIC',
        confidence: 0.3,
      };
    }

    return null;
  }

  async getProductWithPrice(
    productId: string,
    storeId?: string
  ): Promise<ProductResponse | null> {
    const product = await this.prisma.groceryProduct.findUnique({
      where: { id: productId },
      include: {
        prices: storeId
          ? { where: { storeId }, take: 1 }
          : { take: 1, orderBy: { lastChecked: 'desc' } },
      },
    });

    if (!product) {
      return null;
    }

    return this.mapDbProduct(product, product.prices[0]);
  }

  private async saveAndMapKrogerProducts(
    products: any[],
    storeId?: string
  ): Promise<ProductResponse[]> {
    const results: ProductResponse[] = [];

    for (const kp of products) {
      const saved = await this.prisma.groceryProduct.upsert({
        where: { upc: kp.upc },
        create: {
          upc: kp.upc,
          name: kp.name,
          brand: kp.brand,
          description: kp.description,
          category: kp.category,
          imageUrl: kp.imageUrl,
          krogerProductId: kp.productId,
        },
        update: {
          name: kp.name,
          brand: kp.brand,
          imageUrl: kp.imageUrl,
          lastUpdated: new Date(),
        },
      });

      // Save price if available
      if (storeId && kp.regularPrice !== undefined) {
        await this.prisma.productPrice.upsert({
          where: {
            productId_storeId: { productId: saved.id, storeId },
          },
          create: {
            productId: saved.id,
            storeId,
            regularPrice: kp.regularPrice,
            salePrice: kp.salePrice,
            inStock: kp.inStock,
          },
          update: {
            regularPrice: kp.regularPrice,
            salePrice: kp.salePrice,
            inStock: kp.inStock,
            lastChecked: new Date(),
          },
        });
      }

      // Save aisle data if available
      if (storeId && kp.aisle) {
        await this.prisma.storeAisleData.upsert({
          where: {
            storeId_productName: { storeId, productName: kp.name },
          },
          create: {
            storeId,
            productId: saved.id,
            productName: kp.name,
            category: kp.category || 'other',
            aisle: kp.aisle,
            section: kp.aisleDescription,
            source: 'KROGER_API',
          },
          update: {
            aisle: kp.aisle,
            section: kp.aisleDescription,
            lastUpdated: new Date(),
          },
        });
      }

      results.push({
        id: saved.id,
        upc: saved.upc || undefined,
        name: saved.name,
        brand: saved.brand || undefined,
        description: saved.description || undefined,
        category: saved.category || undefined,
        imageUrl: saved.imageUrl || undefined,
        aisle: kp.aisle,
        price: kp.regularPrice !== undefined
          ? {
              regularPrice: kp.regularPrice,
              salePrice: kp.salePrice,
              inStock: kp.inStock,
              lastChecked: new Date(),
            }
          : undefined,
      });
    }

    return results;
  }

  private async saveAndMapOpenFoodFactsProducts(products: any[]): Promise<ProductResponse[]> {
    const results: ProductResponse[] = [];

    for (const offp of products) {
      const saved = await this.prisma.groceryProduct.upsert({
        where: { upc: offp.barcode },
        create: {
          upc: offp.barcode,
          name: offp.name,
          brand: offp.brand,
          description: offp.description,
          category: offp.category,
          imageUrl: offp.imageUrl,
          size: offp.size,
          nutritionGrade: offp.nutritionGrade,
          novaGroup: offp.novaGroup,
          calories: offp.calories,
          fat: offp.fat,
          saturatedFat: offp.saturatedFat,
          carbohydrates: offp.carbohydrates,
          sugars: offp.sugars,
          fiber: offp.fiber,
          protein: offp.protein,
          sodium: offp.sodium,
          openFoodFactsId: offp.barcode,
        },
        update: {
          name: offp.name,
          brand: offp.brand,
          lastUpdated: new Date(),
        },
      });

      results.push({
        id: saved.id,
        upc: saved.upc || undefined,
        name: saved.name,
        brand: saved.brand || undefined,
        description: saved.description || undefined,
        category: saved.category || undefined,
        imageUrl: saved.imageUrl || undefined,
        nutritionGrade: saved.nutritionGrade || undefined,
      });
    }

    return results;
  }

  private mapDbProduct(product: any, price?: any): ProductResponse {
    return {
      id: product.id,
      upc: product.upc || undefined,
      name: product.name,
      brand: product.brand || undefined,
      description: product.description || undefined,
      category: product.category || undefined,
      imageUrl: product.imageUrl || undefined,
      size: product.size,
      nutritionGrade: product.nutritionGrade || undefined,
      price: price
        ? {
            regularPrice: price.regularPrice,
            salePrice: price.salePrice || undefined,
            pricePerUnit: price.pricePerUnit || undefined,
            unitOfMeasure: price.unitOfMeasure || undefined,
            inStock: price.inStock,
            lastChecked: price.lastChecked,
          }
        : undefined,
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula for distance in miles
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private guessAisleByProductName(name: string): string | null {
    const lowerName = name.toLowerCase();

    const aisleMap: Record<string, string[]> = {
      'Produce': ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'potato', 'carrot', 'celery', 'pepper', 'cucumber', 'broccoli', 'spinach'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
      'Meat & Seafood': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'bacon', 'sausage'],
      'Bakery': ['bread', 'bagel', 'muffin', 'cake', 'donut', 'croissant'],
      'Frozen': ['frozen', 'ice cream', 'pizza'],
      'Canned Goods': ['canned', 'soup', 'beans', 'tomato sauce'],
      'Pasta & Rice': ['pasta', 'spaghetti', 'rice', 'noodle'],
      'Snacks': ['chips', 'crackers', 'popcorn', 'nuts', 'cookies'],
      'Beverages': ['soda', 'juice', 'water', 'coffee', 'tea'],
      'Condiments': ['ketchup', 'mustard', 'mayo', 'sauce', 'dressing'],
      'Spices': ['salt', 'pepper', 'spice', 'seasoning', 'herb'],
      'Cereal & Breakfast': ['cereal', 'oatmeal', 'pancake', 'syrup'],
    };

    for (const [aisle, keywords] of Object.entries(aisleMap)) {
      if (keywords.some((kw) => lowerName.includes(kw))) {
        return aisle;
      }
    }

    return null;
  }
}
