import { Injectable, Logger } from '@nestjs/common';

interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands: string;
  generic_name?: string;
  categories?: string;
  image_url?: string;
  image_front_url?: string;
  quantity?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  nutriments?: {
    'energy-kcal_100g'?: number;
    fat_100g?: number;
    'saturated-fat_100g'?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    sodium_100g?: number;
    salt_100g?: number;
  };
  ingredients_text?: string;
  allergens_tags?: string[];
  labels_tags?: string[];
}

interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

interface OpenFoodFactsSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

export interface OpenFoodFactsResult {
  barcode: string;
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  size?: string;
  nutritionGrade?: string;
  novaGroup?: number;
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  sodium?: number;
  ingredients?: string;
  allergens?: string[];
  labels?: string[];
}

@Injectable()
export class OpenFoodFactsApiService {
  private readonly logger = new Logger(OpenFoodFactsApiService.name);
  private readonly baseUrl = 'https://world.openfoodfacts.org/api/v2';
  private readonly userAgent = 'GramGrab/1.0 (https://gramgrab.app)';

  async getProductByBarcode(barcode: string): Promise<OpenFoodFactsResult | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        this.logger.warn(`Open Food Facts API returned ${response.status} for barcode ${barcode}`);
        return null;
      }

      const data: OpenFoodFactsResponse = await response.json();

      if (data.status !== 1 || !data.product) {
        return null;
      }

      return this.mapProduct(data.product);
    } catch (error) {
      this.logger.error(`Failed to fetch product from Open Food Facts: ${barcode}`, error);
      return null;
    }
  }

  async searchProducts(query: string, limit: number = 20): Promise<OpenFoodFactsResult[]> {
    try {
      const params = new URLSearchParams({
        search_terms: query,
        page_size: limit.toString(),
        json: '1',
        fields: 'code,product_name,brands,generic_name,categories,image_url,image_front_url,quantity,nutriscore_grade,nova_group,nutriments,ingredients_text,allergens_tags,labels_tags',
      });

      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        this.logger.warn(`Open Food Facts search returned ${response.status}`);
        return [];
      }

      const data: OpenFoodFactsSearchResponse = await response.json();

      return data.products
        .filter((p) => p.product_name)
        .map((product) => this.mapProduct(product));
    } catch (error) {
      this.logger.error('Failed to search Open Food Facts', error);
      return [];
    }
  }

  async searchByCategory(category: string, limit: number = 20): Promise<OpenFoodFactsResult[]> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json?page_size=${limit}`,
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data: OpenFoodFactsSearchResponse = await response.json();

      return data.products
        .filter((p) => p.product_name)
        .map((product) => this.mapProduct(product));
    } catch (error) {
      this.logger.error(`Failed to search Open Food Facts by category: ${category}`, error);
      return [];
    }
  }

  private mapProduct(product: OpenFoodFactsProduct): OpenFoodFactsResult {
    const nutriments = product.nutriments || {};

    return {
      barcode: product.code,
      name: product.product_name || '',
      brand: product.brands,
      description: product.generic_name,
      category: this.parseCategory(product.categories),
      imageUrl: product.image_front_url || product.image_url,
      size: product.quantity,
      nutritionGrade: product.nutriscore_grade?.toUpperCase(),
      novaGroup: product.nova_group,
      calories: nutriments['energy-kcal_100g'],
      fat: nutriments.fat_100g,
      saturatedFat: nutriments['saturated-fat_100g'],
      carbohydrates: nutriments.carbohydrates_100g,
      sugars: nutriments.sugars_100g,
      fiber: nutriments.fiber_100g,
      protein: nutriments.proteins_100g,
      sodium: this.convertSodium(nutriments.sodium_100g, nutriments.salt_100g),
      ingredients: product.ingredients_text,
      allergens: product.allergens_tags?.map((a) => a.replace('en:', '')),
      labels: product.labels_tags?.map((l) => l.replace('en:', '')),
    };
  }

  private parseCategory(categories?: string): string | undefined {
    if (!categories) return undefined;

    // Categories are comma-separated, take the most specific (last) one
    const cats = categories.split(',').map((c) => c.trim());
    return cats[cats.length - 1];
  }

  private convertSodium(sodiumMg?: number, saltG?: number): number | undefined {
    // Prefer direct sodium value, otherwise calculate from salt
    if (sodiumMg !== undefined) {
      return sodiumMg;
    }
    if (saltG !== undefined) {
      // Salt is ~40% sodium
      return saltG * 400;
    }
    return undefined;
  }
}
