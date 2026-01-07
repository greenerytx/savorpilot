import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParsedRecipeDto } from './dto/parse-recipe.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly model = 'gpt-4o-mini';

  /**
   * Decode HTML entities in a string
   */
  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2019;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x3A;/g, ':')
      .replace(/&#x3D;/g, '=')
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  }

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured');
    }
  }

  /**
   * Parse raw text into a structured recipe using OpenAI
   */
  async parseRecipeFromText(text: string): Promise<ParsedRecipeDto> {
    this.logger.log('Parsing recipe from text...');

    const systemPrompt = `You are a professional recipe parser. Extract structured recipe data from the provided text.

Return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "servings": number or null,
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT" or null,
  "category": "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "APPETIZER" | "SNACK" | "DESSERT" | "BEVERAGE" | "SOUP" | "SALAD" | "SIDE_DISH" | "MAIN_COURSE" | "SAUCE" | "BREAD" | "BAKING" | "OTHER" or null,
  "cuisine": "Cuisine type (Italian, Mexican, etc.)" or null,
  "tags": ["array", "of", "tags"],
  "components": [
    {
      "name": "Main" (or section name like "Sauce", "Dressing", etc.),
      "ingredients": [
        {
          "quantity": number or null,
          "unit": "unit" or null,
          "name": "ingredient name",
          "notes": "preparation notes" or null,
          "optional": boolean
        }
      ],
      "steps": [
        {
          "order": 1,
          "instruction": "Step instruction",
          "duration": minutes or null,
          "tips": "helpful tip" or null
        }
      ]
    }
  ],
  "confidence": 0.0-1.0 (how confident you are in the parsing)
}

Rules:
- Parse quantities as numbers (convert fractions: 1/2 = 0.5, 1/4 = 0.25)
- Separate ingredient name from preparation notes (e.g., "onion, diced" -> name: "onion", notes: "diced")
- Infer difficulty based on technique complexity and time
- Infer category based on dish type
- Extract or infer cuisine from ingredients/techniques
- If recipe has distinct sections (e.g., sauce, marinade), create separate components
- Return ONLY valid JSON, no markdown or explanation`;

    const response = await this.callOpenAI(systemPrompt, text);

    try {
      // Clean up response - remove markdown code blocks if present
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Successfully parsed recipe: ${parsed.title}`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response as JSON', error);
      throw new Error('Failed to parse recipe. Please try again or enter manually.');
    }
  }

  /**
   * Generate a recipe from ingredients using OpenAI
   */
  async generateRecipeFromIngredients(
    ingredients: string[],
    preferences?: {
      cuisine?: string;
      difficulty?: string;
      dietary?: string[];
      mealType?: string;
    },
  ): Promise<ParsedRecipeDto> {
    this.logger.log(`Generating recipe from ${ingredients.length} ingredients...`);

    const preferencesText = preferences
      ? `
Preferences:
- Cuisine: ${preferences.cuisine || 'Any'}
- Difficulty: ${preferences.difficulty || 'Any'}
- Dietary restrictions: ${preferences.dietary?.join(', ') || 'None'}
- Meal type: ${preferences.mealType || 'Any'}`
      : '';

    const systemPrompt = `You are a creative chef. Generate a delicious recipe using the provided ingredients.

Return a JSON object with the same structure as a parsed recipe:
{
  "title": "Creative recipe name",
  "description": "Appetizing description",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT",
  "category": "BREAKFAST" | "LUNCH" | "DINNER" | etc.,
  "cuisine": "Cuisine type",
  "tags": ["relevant", "tags"],
  "components": [
    {
      "name": "Main",
      "ingredients": [
        {
          "quantity": number,
          "unit": "unit",
          "name": "ingredient",
          "notes": "prep notes" or null,
          "optional": boolean
        }
      ],
      "steps": [
        {
          "order": 1,
          "instruction": "Clear, detailed step",
          "duration": minutes or null,
          "tips": "helpful tip" or null
        }
      ]
    }
  ],
  "confidence": 1.0
}

Rules:
- Use primarily the provided ingredients
- Add common pantry staples if needed (salt, pepper, oil, etc.)
- Make the recipe practical and achievable
- Include helpful tips for each step
- Be creative but realistic
- Return ONLY valid JSON`;

    const userPrompt = `Create a recipe using these ingredients: ${ingredients.join(', ')}${preferencesText}`;

    const response = await this.callOpenAI(systemPrompt, userPrompt);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Successfully generated recipe: ${parsed.title}`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response as JSON', error);
      throw new Error('Failed to generate recipe. Please try again.');
    }
  }

  /**
   * Extract recipe from URL (website, Instagram, etc.)
   */
  async parseRecipeFromUrl(url: string): Promise<ParsedRecipeDto> {
    this.logger.log(`Extracting recipe from URL: ${url}`);

    // Check if it's an Instagram URL
    if (url.includes('instagram.com')) {
      return this.parseInstagramUrl(url);
    }

    // Fetch the page content
    const { html, textContent } = await this.fetchPageContent(url);

    // Try to extract Schema.org Recipe data first
    const schemaRecipe = this.extractSchemaOrgRecipe(html);

    if (schemaRecipe) {
      this.logger.log('Found Schema.org Recipe data, converting directly');
      const converted = this.convertSchemaOrgToRecipe(schemaRecipe, url);
      if (converted.components[0]?.ingredients?.length > 0) {
        this.logger.log(`Successfully extracted recipe from Schema.org: ${converted.title}`);
        return converted;
      }
    }

    // Fall back to AI parsing
    this.logger.log('No valid Schema.org data found, using AI parsing');
    return this.parseRecipeWithAI(url, textContent, html);
  }

  /**
   * Parse Instagram URL using oEmbed and AI
   */
  private async parseInstagramUrl(url: string): Promise<ParsedRecipeDto> {
    this.logger.log(`Parsing Instagram URL: ${url}`);

    let caption = '';
    let author = '';
    let thumbnail = '';
    let videoUrl = '';

    // Try Instagram oEmbed API to get post metadata
    try {
      const oEmbedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
      const oEmbedResponse = await fetch(oEmbedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (oEmbedResponse.ok) {
        const contentType = oEmbedResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const oEmbed = await oEmbedResponse.json();
          this.logger.log(`Instagram oEmbed data received`);

          // Extract caption from HTML (it's embedded in the response)
          if (oEmbed.html) {
            const captionMatch = oEmbed.html.match(/<p>([^<]+)<\/p>/);
            if (captionMatch) {
              caption = captionMatch[1];
            }
          }
          author = oEmbed.author_name || '';
          thumbnail = oEmbed.thumbnail_url || '';
        } else {
          this.logger.warn(`Instagram oEmbed returned non-JSON: ${contentType}`);
        }
      } else {
        this.logger.warn(`Instagram oEmbed failed: ${oEmbedResponse.status}`);
      }
    } catch (oEmbedError) {
      this.logger.warn('Instagram oEmbed request failed', oEmbedError);
    }

    // If we couldn't get caption from oEmbed, try direct fetch with special handling
    if (!caption) {
      this.logger.log('Trying direct fetch for Instagram metadata...');
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
        });

        if (response.ok) {
          const html = await response.text();
          this.logger.log(`Instagram HTML fetched (${html.length} bytes)`);

          // Try to extract from meta tags (these are usually present)
          const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
                           html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);
          if (descMatch) {
            // Decode HTML entities
            caption = descMatch[1]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#x27;/g, "'")
              .replace(/&#x2F;/g, '/');
            this.logger.log(`Extracted og:description (${caption.length} chars)`);
          }

          const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                            html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
          if (titleMatch && !author) {
            // Decode HTML entities and extract just the username before " on Instagram"
            let extractedAuthor = this.decodeHtmlEntities(titleMatch[1]);
            // Try to get just the username part
            const onInstagramMatch = extractedAuthor.match(/^(.+?)\s+on\s+Instagram/i);
            if (onInstagramMatch) {
              extractedAuthor = onInstagramMatch[1];
            }
            // Truncate to 500 chars max (VARCHAR limit)
            author = extractedAuthor.substring(0, 500);
            this.logger.log(`Extracted author: ${author}`);
          }

          const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                            html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
          if (imageMatch && !thumbnail) {
            thumbnail = this.decodeHtmlEntities(imageMatch[1]);
            this.logger.log(`Extracted thumbnail URL (${thumbnail.length} chars)`);
          }

          // Try to extract video URL for reels/videos
          const videoMatch = html.match(/<meta[^>]*property="og:video(?::url)?"[^>]*content="([^"]+)"/i) ||
                            html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:video(?::url)?"/i);
          if (videoMatch && !videoUrl) {
            videoUrl = this.decodeHtmlEntities(videoMatch[1]);
            this.logger.log(`Extracted video URL (${videoUrl.length} chars)`);
          }
        } else {
          this.logger.warn(`Direct Instagram fetch failed: ${response.status}`);
        }
      } catch (fetchError) {
        this.logger.warn('Direct Instagram fetch failed', fetchError);
      }
    }

    // If still no caption, provide a helpful error
    if (!caption) {
      this.logger.error('Could not extract any caption from Instagram post');
      throw new Error('Could not extract caption from Instagram. The post may be private, a video without text, or require login.');
    }

    this.logger.log(`Instagram caption extracted (${caption.length} chars): ${caption.substring(0, 200)}...`);

    // Use AI to parse the caption into a recipe
    try {
      const systemPrompt = `You are a professional recipe parser. Extract a structured recipe from an Instagram post caption.

Instagram recipe posts often have:
- Recipe title (sometimes in all caps or with emojis)
- Ingredient lists (with quantities)
- Step-by-step instructions
- Tips and serving suggestions

IMPORTANT: Many recipes have MULTIPLE COMPONENTS (e.g., "For the dough:", "For the filling:", "For the frosting:", "Sauce:", "Marinade:", etc.).
Create a SEPARATE component for each distinct section of ingredients. Each component should have its own name matching the section header.
Examples of component names: "Dough", "Filling", "Frosting", "Sauce", "Caramel", "Chocolate Cream", "Layers", "Topping", etc.

Return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "servings": number or null,
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT" or null,
  "category": "BREAKFAST" | "LUNCH" | "DINNER" | "DESSERT" | "SNACK" | "OTHER" or null,
  "cuisine": "Cuisine type" or null,
  "tags": ["array", "of", "tags"],
  "components": [
    {
      "name": "Layers",
      "ingredients": [
        {
          "quantity": number or null,
          "unit": "unit" or null,
          "name": "ingredient name",
          "notes": "notes" or null,
          "optional": boolean
        }
      ],
      "steps": [
        {
          "order": 1,
          "instruction": "Step instruction",
          "duration": null,
          "tips": null
        }
      ]
    },
    {
      "name": "Chocolate Cream",
      "ingredients": [...],
      "steps": [...]
    },
    {
      "name": "Caramel",
      "ingredients": [...],
      "steps": [...]
    }
  ],
  "confidence": 0.0-1.0
}

If the content doesn't contain a recipe, still create a best-effort structure with confidence: 0.3 or lower.
Return ONLY valid JSON.`;

      const userPrompt = `Instagram Post by: ${author || 'Unknown'}

Caption:
${caption}`;

      const response = await this.callOpenAI(systemPrompt, userPrompt);

      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const parsed = JSON.parse(jsonStr.trim());

      // Add source info
      parsed.sourceUrl = url;
      parsed.sourceAuthor = author || undefined;
      parsed.imageUrl = thumbnail || undefined;
      parsed.videoUrl = videoUrl || undefined;

      this.logger.log(`Successfully parsed Instagram recipe: ${parsed.title} (confidence: ${parsed.confidence})`);
      return parsed;

    } catch (aiError) {
      this.logger.error('Failed to parse Instagram caption with AI', aiError);
      throw new Error('Failed to parse recipe from Instagram caption. Please check the OpenAI API configuration.');
    }
  }

  /**
   * Extract Schema.org Recipe from HTML
   */
  private extractSchemaOrgRecipe(html: string): any | null {
    try {
      // Find all JSON-LD blocks
      const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      const jsonLdBlocks: any[] = [];

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const parsed = JSON.parse(match[1].trim());
          jsonLdBlocks.push(parsed);
        } catch {
          // Skip invalid JSON
        }
      }

      // Search for Recipe type in all blocks
      for (const block of jsonLdBlocks) {
        const recipe = this.findRecipeInSchema(block);
        if (recipe) return recipe;
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to extract Schema.org data', error);
      return null;
    }
  }

  /**
   * Recursively find Recipe in Schema.org data
   */
  private findRecipeInSchema(data: any): any | null {
    if (!data) return null;

    // Direct Recipe type
    if (data['@type'] === 'Recipe') return data;

    // Array of types (some sites use ["Recipe", "HowTo"])
    if (Array.isArray(data['@type']) && data['@type'].includes('Recipe')) return data;

    // Check @graph array
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      for (const item of data['@graph']) {
        const recipe = this.findRecipeInSchema(item);
        if (recipe) return recipe;
      }
    }

    // Check array of items
    if (Array.isArray(data)) {
      for (const item of data) {
        const recipe = this.findRecipeInSchema(item);
        if (recipe) return recipe;
      }
    }

    return null;
  }

  /**
   * Convert Schema.org Recipe to our format
   */
  private convertSchemaOrgToRecipe(schema: any, url: string): ParsedRecipeDto {
    // Parse duration (PT30M -> 30)
    const parseDuration = (duration: string | undefined): number | undefined => {
      if (!duration) return undefined;
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
      if (match) {
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        return hours * 60 + minutes;
      }
      return undefined;
    };

    // Parse yield (servings)
    const parseYield = (recipeYield: any): number | undefined => {
      if (!recipeYield) return undefined;
      if (typeof recipeYield === 'number') return recipeYield;
      if (typeof recipeYield === 'string') {
        const match = recipeYield.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : undefined;
      }
      if (Array.isArray(recipeYield)) {
        return parseYield(recipeYield[0]);
      }
      return undefined;
    };

    // Parse ingredient string to structured format
    const parseIngredient = (ingredient: string): any => {
      // Common patterns: "2 cups flour", "1/2 tsp salt", "3 large eggs"
      const match = ingredient.match(/^([\d./\s]+)?\s*(\w+(?:\s+\w+)?)?\s*(.+)$/);

      if (match) {
        let quantity: number | undefined;
        const qtyStr = match[1]?.trim();
        if (qtyStr) {
          // Handle fractions
          if (qtyStr.includes('/')) {
            const parts = qtyStr.split('/');
            quantity = parseFloat(parts[0]) / parseFloat(parts[1]);
          } else {
            quantity = parseFloat(qtyStr);
          }
        }

        // Common units
        const units = ['cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
                       'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'g', 'gram', 'grams',
                       'kg', 'ml', 'liter', 'liters', 'quart', 'quarts', 'pint', 'pints', 'gallon',
                       'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces', 'can', 'cans',
                       'package', 'packages', 'bunch', 'bunches', 'head', 'heads', 'stalk', 'stalks',
                       'large', 'medium', 'small'];

        const possibleUnit = match[2]?.toLowerCase();
        const unit = units.includes(possibleUnit || '') ? possibleUnit : undefined;
        const name = unit ? match[3] : (match[2] ? `${match[2]} ${match[3]}` : match[3]);

        return {
          quantity: isNaN(quantity!) ? undefined : quantity,
          unit: unit || undefined,
          name: name?.trim() || ingredient,
          optional: ingredient.toLowerCase().includes('optional'),
        };
      }

      return { name: ingredient, optional: false };
    };

    // Parse instructions
    const parseInstructions = (instructions: any): any[] => {
      if (!instructions) return [];

      // Array of strings
      if (Array.isArray(instructions) && typeof instructions[0] === 'string') {
        return instructions.map((inst, idx) => ({
          order: idx + 1,
          instruction: inst,
        }));
      }

      // Array of HowToStep objects
      if (Array.isArray(instructions)) {
        return instructions
          .filter((inst: any) => inst['@type'] === 'HowToStep' || inst.text)
          .map((inst: any, idx: number) => ({
            order: idx + 1,
            instruction: inst.text || inst.name || '',
          }));
      }

      // HowToSection with itemListElement
      if (instructions.itemListElement) {
        return parseInstructions(instructions.itemListElement);
      }

      // Single string
      if (typeof instructions === 'string') {
        return instructions.split(/\.\s+/).filter(Boolean).map((inst, idx) => ({
          order: idx + 1,
          instruction: inst.trim() + (inst.endsWith('.') ? '' : '.'),
        }));
      }

      return [];
    };

    // Get author
    const getAuthor = (author: any): string | undefined => {
      if (!author) return undefined;
      if (typeof author === 'string') return author;
      if (author.name) return author.name;
      if (Array.isArray(author)) return getAuthor(author[0]);
      return undefined;
    };

    // Get image URL
    const getImage = (image: any): string | undefined => {
      if (!image) return undefined;
      if (typeof image === 'string') return image;
      if (image.url) return image.url;
      if (Array.isArray(image)) return getImage(image[0]);
      return undefined;
    };

    // Get category
    const mapCategory = (category: string | string[] | undefined): string | undefined => {
      if (!category) return undefined;
      const cat = Array.isArray(category) ? category[0] : category;
      const lower = cat.toLowerCase();

      const categoryMap: Record<string, string> = {
        'breakfast': 'BREAKFAST',
        'brunch': 'BRUNCH',
        'lunch': 'LUNCH',
        'dinner': 'DINNER',
        'main course': 'MAIN_COURSE',
        'main dish': 'MAIN_COURSE',
        'appetizer': 'APPETIZER',
        'starter': 'APPETIZER',
        'snack': 'SNACK',
        'dessert': 'DESSERT',
        'beverage': 'BEVERAGE',
        'drink': 'BEVERAGE',
        'soup': 'SOUP',
        'salad': 'SALAD',
        'side dish': 'SIDE_DISH',
        'side': 'SIDE_DISH',
        'sauce': 'SAUCE',
        'bread': 'BREAD',
        'baking': 'BAKING',
      };

      for (const [key, value] of Object.entries(categoryMap)) {
        if (lower.includes(key)) return value;
      }
      return 'OTHER';
    };

    // Build ingredients array
    const ingredients = Array.isArray(schema.recipeIngredient)
      ? schema.recipeIngredient.map(parseIngredient)
      : [];

    // Build steps array
    const steps = parseInstructions(schema.recipeInstructions);

    return {
      title: schema.name || 'Untitled Recipe',
      description: schema.description,
      imageUrl: getImage(schema.image),
      prepTimeMinutes: parseDuration(schema.prepTime),
      cookTimeMinutes: parseDuration(schema.cookTime),
      servings: parseYield(schema.recipeYield),
      category: mapCategory(schema.recipeCategory) as any,
      cuisine: Array.isArray(schema.recipeCuisine) ? schema.recipeCuisine[0] : schema.recipeCuisine,
      tags: schema.keywords ? (typeof schema.keywords === 'string' ? schema.keywords.split(',').map((k: string) => k.trim()) : schema.keywords) : [],
      components: [{
        name: 'Main',
        ingredients,
        steps,
      }],
      confidence: 0.95,
      sourceUrl: url,
      sourceAuthor: getAuthor(schema.author),
    };
  }

  /**
   * Parse recipe using AI when Schema.org data is not available
   */
  private async parseRecipeWithAI(url: string, textContent: string, html: string): Promise<ParsedRecipeDto> {
    // Extract any JSON-LD for context even if not valid Recipe
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    const jsonLd = jsonLdMatch ? jsonLdMatch[1] : '';

    const systemPrompt = `You are a professional recipe extractor. Extract structured recipe data from the provided webpage content.

The content may be from Instagram (look for caption text), a food blog, or a recipe website.

Return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "servings": number or null,
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT" or null,
  "category": "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "APPETIZER" | "SNACK" | "DESSERT" | "BEVERAGE" | "SOUP" | "SALAD" | "SIDE_DISH" | "MAIN_COURSE" | "SAUCE" | "BREAD" | "BAKING" | "OTHER" or null,
  "cuisine": "Cuisine type" or null,
  "tags": ["array", "of", "tags"],
  "components": [
    {
      "name": "Main",
      "ingredients": [
        {
          "quantity": number or null,
          "unit": "unit" or null,
          "name": "ingredient name",
          "notes": "preparation notes" or null,
          "optional": boolean
        }
      ],
      "steps": [
        {
          "order": 1,
          "instruction": "Step instruction",
          "duration": minutes or null,
          "tips": "helpful tip" or null
        }
      ]
    }
  ],
  "confidence": 0.0-1.0,
  "sourceUrl": "${url}",
  "sourceAuthor": "Author name if found" or null
}

Rules:
- Extract as much information as possible from the content
- Parse quantities as numbers (convert fractions: 1/2 = 0.5)
- If it's an Instagram post, the recipe is usually in the caption
- If no clear recipe found, return confidence: 0 and a minimal structure
- Return ONLY valid JSON, no markdown or explanation`;

    const userContent = `URL: ${url}\n\nJSON-LD Schema (if available):\n${jsonLd}\n\nPage Content:\n${textContent.substring(0, 12000)}`;
    const response = await this.callOpenAI(systemPrompt, userContent);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Successfully extracted recipe via AI: ${parsed.title} (confidence: ${parsed.confidence})`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI response as JSON', error);
      throw new Error('Failed to extract recipe from URL. Please try again or enter manually.');
    }
  }

  /**
   * Fetch webpage content for recipe extraction
   */
  private async fetchPageContent(url: string): Promise<{ html: string; textContent: string }> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }

      const html = await response.text();

      // Extract text content (simplified - remove HTML tags)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return { html, textContent };
    } catch (error) {
      this.logger.error(`Failed to fetch URL: ${url}`, error);
      throw new Error('Failed to fetch URL. Please check the URL and try again.');
    }
  }

  /**
   * Parse recipe from an image using GPT-4 Vision
   */
  async parseRecipeFromImage(imageBuffer: Buffer, mimeType: string): Promise<ParsedRecipeDto> {
    this.logger.log('Parsing recipe from image...');

    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const systemPrompt = `You are a professional recipe parser with OCR capabilities. Extract structured recipe data from the provided image.

The image may contain:
- A handwritten recipe
- A printed recipe from a cookbook or magazine
- A screenshot of a recipe
- A photo of a recipe card

Return a JSON object with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description of the dish",
  "prepTimeMinutes": number or null,
  "cookTimeMinutes": number or null,
  "servings": number or null,
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT" or null,
  "category": "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "APPETIZER" | "SNACK" | "DESSERT" | "BEVERAGE" | "SOUP" | "SALAD" | "SIDE_DISH" | "MAIN_COURSE" | "SAUCE" | "BREAD" | "BAKING" | "OTHER" or null,
  "cuisine": "Cuisine type" or null,
  "tags": ["array", "of", "tags"],
  "components": [
    {
      "name": "Main",
      "ingredients": [
        {
          "quantity": number or null,
          "unit": "unit" or null,
          "name": "ingredient name",
          "notes": "preparation notes" or null,
          "optional": boolean
        }
      ],
      "steps": [
        {
          "order": 1,
          "instruction": "Step instruction",
          "duration": minutes or null,
          "tips": "helpful tip" or null
        }
      ]
    }
  ],
  "confidence": 0.0-1.0 (how confident you are in the parsing)
}

Rules:
- Read ALL text visible in the image carefully
- Parse quantities as numbers (convert fractions: 1/2 = 0.5, 1/4 = 0.25)
- Separate ingredient name from preparation notes
- Infer difficulty based on technique complexity
- If recipe has distinct sections, create separate components
- If you cannot read the text clearly, set confidence low
- Return ONLY valid JSON, no markdown or explanation`;

    const response = await this.callOpenAIVision(systemPrompt, dataUrl);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Successfully parsed recipe from image: ${parsed.title} (confidence: ${parsed.confidence})`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse OpenAI Vision response as JSON', error);
      throw new Error('Failed to parse recipe from image. Please try again or enter manually.');
    }
  }

  /**
   * Call OpenAI Vision API for image analysis
   */
  private async callOpenAIVision(systemPrompt: string, imageDataUrl: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: 'Please extract the recipe from this image and return it as structured JSON.',
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenAI Vision API error: ${response.status} - ${error}`);
      throw new Error(`OpenAI Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Generate cooking steps from ingredients when no steps exist
   * Creates complete cooking instructions based on ingredients and recipe title
   */
  async generateStepsFromIngredients(
    title: string,
    ingredients: { quantity?: number; unit?: string; name: string }[],
  ): Promise<{ steps: { order: number; instruction: string; duration?: number; tips?: string }[] }> {
    this.logger.log(`Generating steps from ingredients for recipe: ${title}`);

    const ingredientList = ingredients
      .map((ing) => {
        const qty = ing.quantity ? `${ing.quantity} ` : '';
        const unit = ing.unit ? `${ing.unit} ` : '';
        return `${qty}${unit}${ing.name}`;
      })
      .join('\n- ');

    const systemPrompt = `You are a professional chef. Generate complete cooking instructions for a recipe based on its title and ingredients.

You are given:
1. The recipe title
2. A list of ingredients

Your task is to create clear, detailed cooking instructions that a home cook can follow.

Return a JSON object with this exact structure:
{
  "steps": [
    {
      "order": 1,
      "instruction": "Detailed, clear instruction for this step (2-3 sentences)",
      "duration": estimated minutes for this step or null,
      "tips": "helpful tip for this step" or null
    }
  ]
}

Rules:
- Create logical cooking steps that use all the ingredients
- Each instruction should be 1-3 sentences with specific details
- Include temperatures, timing, and technique descriptions
- Add helpful tips where appropriate
- Typical recipes have 4-8 steps
- Consider prep steps (chopping, measuring) and cooking steps separately
- Return ONLY valid JSON, no markdown or explanation`;

    const userPrompt = `Recipe: ${title}

Ingredients:
- ${ingredientList}

Generate complete cooking instructions for this recipe.`;

    const response = await this.callOpenAI(systemPrompt, userPrompt);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Generated ${parsed.steps?.length || 0} steps from ingredients`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse step generation response', error);
      throw new Error('Failed to generate cooking steps. Please try again.');
    }
  }

  /**
   * Generate detailed cooking steps from step headers/titles
   * Used when a recipe only has step titles without detailed instructions
   */
  async generateDetailedSteps(
    title: string,
    ingredients: { quantity?: number; unit?: string; name: string }[],
    existingSteps: { order: number; instruction: string; duration?: number; tips?: string }[],
  ): Promise<{ steps: { order: number; instruction: string; duration?: number; tips?: string }[] }> {
    this.logger.log(`Generating detailed steps for recipe: ${title}`);

    const ingredientList = ingredients
      .map((ing) => {
        const qty = ing.quantity ? `${ing.quantity} ` : '';
        const unit = ing.unit ? `${ing.unit} ` : '';
        return `${qty}${unit}${ing.name}`;
      })
      .join('\n- ');

    const existingStepsList = existingSteps
      .map((step) => `${step.order}. ${step.instruction}`)
      .join('\n');

    const systemPrompt = `You are a professional chef. Generate detailed, clear cooking instructions for a recipe.

You are given:
1. The recipe title
2. A list of ingredients
3. Existing step headers/titles that may be incomplete or just brief summaries

Your task is to expand each step into a detailed, clear instruction that a home cook can follow.

Return a JSON object with this exact structure:
{
  "steps": [
    {
      "order": 1,
      "instruction": "Detailed, clear instruction for this step (2-3 sentences)",
      "duration": estimated minutes for this step or null,
      "tips": "helpful tip for this step" or null
    }
  ]
}

Rules:
- Keep the same number of steps as the original (or slightly modify if needed for clarity)
- Each instruction should be 1-3 sentences with specific details
- Include temperatures, timing, and technique descriptions
- Add helpful tips where appropriate
- Ensure instructions are practical and actionable
- Return ONLY valid JSON, no markdown or explanation`;

    const userPrompt = `Recipe: ${title}

Ingredients:
- ${ingredientList}

Existing Steps (expand these into detailed instructions):
${existingStepsList}`;

    const response = await this.callOpenAI(systemPrompt, userPrompt);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Generated ${parsed.steps?.length || 0} detailed steps`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse step generation response', error);
      throw new Error('Failed to generate detailed steps. Please try again.');
    }
  }

  /**
   * Translate recipe content to target language
   */
  async translateRecipe(
    recipe: {
      title: string;
      description?: string;
      components: {
        name: string;
        ingredients: { quantity?: number; unit?: string; name: string; notes?: string; optional?: boolean }[];
        steps: { order: number; instruction: string; duration?: number; tips?: string }[];
      }[];
    },
    targetLanguage: 'en' | 'ar',
  ): Promise<{
    title: string;
    description: string | null;
    components: {
      name: string;
      ingredients: { quantity?: number; unit?: string; name: string; notes?: string; optional?: boolean }[];
      steps: { order: number; instruction: string; duration?: number; tips?: string }[];
    }[];
  }> {
    const languageNames = { en: 'English', ar: 'Arabic' };
    this.logger.log(`Translating recipe "${recipe.title}" to ${languageNames[targetLanguage]}...`);

    const systemPrompt = `You are a professional translator specializing in culinary content. Translate the given recipe to ${languageNames[targetLanguage]}.

IMPORTANT RULES:
- Translate ALL text content: title, description, component names, ingredient names, notes, step instructions, and tips
- Keep the exact same JSON structure
- Preserve all numeric values (quantities, durations, order numbers)
- Preserve units but translate them to the target language's common cooking units if appropriate
- For Arabic: Use formal Modern Standard Arabic suitable for cooking instructions
- Maintain cooking terminology accuracy
- Return ONLY valid JSON, no markdown or explanation

Return a JSON object with this exact structure:
{
  "title": "Translated recipe title",
  "description": "Translated description" or null,
  "components": [
    {
      "name": "Translated component name",
      "ingredients": [
        {
          "quantity": number (keep original),
          "unit": "translated unit" or null,
          "name": "translated ingredient name",
          "notes": "translated notes" or null,
          "optional": boolean (keep original)
        }
      ],
      "steps": [
        {
          "order": number (keep original),
          "instruction": "translated instruction",
          "duration": number (keep original) or null,
          "tips": "translated tips" or null
        }
      ]
    }
  ]
}`;

    const userPrompt = `Translate this recipe to ${languageNames[targetLanguage]}:

${JSON.stringify(recipe, null, 2)}`;

    const response = await this.callOpenAI(systemPrompt, userPrompt);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Successfully translated recipe to ${languageNames[targetLanguage]}: ${parsed.title}`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse translation response', error);
      throw new Error(`Failed to translate recipe to ${languageNames[targetLanguage]}. Please try again.`);
    }
  }

  /**
   * Estimate nutrition information for a recipe (basic - totals only)
   */
  async estimateNutrition(
    ingredients: { quantity?: number; unit?: string; name: string }[],
    servings: number = 4,
  ): Promise<{
    caloriesPerServing: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
  }> {
    const result = await this.estimateNutritionWithBreakdown(ingredients, servings);
    return result.totals;
  }

  /**
   * Estimate nutrition with per-ingredient breakdown
   */
  async estimateNutritionWithBreakdown(
    ingredients: { quantity?: number; unit?: string; name: string }[],
    servings: number = 4,
  ): Promise<{
    totals: {
      caloriesPerServing: number;
      proteinGrams: number;
      carbsGrams: number;
      fatGrams: number;
      fiberGrams?: number;
      sugarGrams?: number;
      sodiumMg?: number;
    };
    breakdown: Array<{
      ingredient: string;
      quantity?: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      percentageOfCalories: number;
    }>;
  }> {
    this.logger.log(`Estimating nutrition with breakdown for ${ingredients.length} ingredients...`);

    const ingredientList = ingredients
      .map((ing) => {
        const qty = ing.quantity ? `${ing.quantity} ` : '';
        const unit = ing.unit ? `${ing.unit} ` : '';
        return `${qty}${unit}${ing.name}`;
      })
      .join('\n- ');

    const systemPrompt = `You are a professional nutritionist. Estimate the nutritional content for the given recipe ingredients.

Calculate the nutrition for EACH ingredient individually, then provide totals per serving.

Return a JSON object with this exact structure:
{
  "totals": {
    "caloriesPerServing": number (total kcal per serving),
    "proteinGrams": number (total grams of protein per serving),
    "carbsGrams": number (total grams of carbohydrates per serving),
    "fatGrams": number (total grams of fat per serving),
    "fiberGrams": number (total grams of fiber per serving),
    "sugarGrams": number (total grams of sugar per serving),
    "sodiumMg": number (total milligrams of sodium per serving)
  },
  "breakdown": [
    {
      "ingredient": "ingredient name",
      "quantity": "2 cups" (the amount used),
      "calories": number (total calories from this ingredient for ALL servings),
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "percentageOfCalories": number (what % of total recipe calories comes from this ingredient)
    }
  ]
}

Rules:
- Use standard nutritional databases (USDA) as reference
- Be conservative with estimates
- Round to whole numbers
- If a quantity is missing, assume a typical amount
- Sort breakdown by calories descending (highest calorie ingredients first)
- percentageOfCalories should sum to ~100%
- Return ONLY valid JSON, no explanation`;

    const userPrompt = `Estimate nutrition for this recipe (${servings} servings):

Ingredients:
- ${ingredientList}`;

    const response = await this.callOpenAI(systemPrompt, userPrompt);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Nutrition estimated: ${parsed.totals.caloriesPerServing} kcal per serving with ${parsed.breakdown?.length || 0} ingredients`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse nutrition response', error);
      throw new Error('Failed to estimate nutrition. Please try again.');
    }
  }

  /**
   * Recipe-contextual chat assistant
   * Answers cooking questions about a specific recipe
   */
  async recipeChat(
    recipe: {
      title: string;
      description?: string;
      servings?: number;
      prepTimeMinutes?: number;
      cookTimeMinutes?: number;
      components: {
        name: string;
        ingredients: { quantity?: number; unit?: string; name: string; notes?: string; optional?: boolean }[];
        steps: { order: number; instruction: string; duration?: number; tips?: string }[];
      }[];
    },
    message: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  ): Promise<{ message: string; suggestions?: string[] }> {
    this.logger.log(`Recipe chat for "${recipe.title}": ${message.substring(0, 50)}...`);

    // Build recipe context
    const ingredientsList = recipe.components
      .flatMap((c) =>
        c.ingredients.map((ing) => {
          const qty = ing.quantity ? `${ing.quantity} ` : '';
          const unit = ing.unit ? `${ing.unit} ` : '';
          const notes = ing.notes ? ` (${ing.notes})` : '';
          const optional = ing.optional ? ' [optional]' : '';
          return `${qty}${unit}${ing.name}${notes}${optional}`;
        })
      )
      .join('\n- ');

    const stepsList = recipe.components
      .flatMap((c) =>
        c.steps.map((s) => {
          const time = s.duration ? ` (${s.duration} min)` : '';
          const tip = s.tips ? ` [Tip: ${s.tips}]` : '';
          return `${s.order}. ${s.instruction}${time}${tip}`;
        })
      )
      .join('\n');

    const recipeContext = `RECIPE: ${recipe.title}
${recipe.description ? `Description: ${recipe.description}` : ''}
Servings: ${recipe.servings || 'Not specified'}
Prep Time: ${recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} minutes` : 'Not specified'}
Cook Time: ${recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} minutes` : 'Not specified'}

INGREDIENTS:
- ${ingredientsList}

STEPS:
${stepsList}`;

    const systemPrompt = `You are a friendly and knowledgeable AI cooking assistant helping someone cook a specific recipe. You have complete knowledge of the recipe below and should ONLY answer questions related to this recipe or general cooking techniques that apply to it.

${recipeContext}

RULES:
1. ONLY answer questions related to this specific recipe or general cooking techniques that apply to making it
2. If asked about a completely unrelated topic (politics, other recipes, etc.), politely redirect: "I'm here to help you cook this ${recipe.title}! What cooking questions do you have about it?"
3. Be helpful with:
   - Ingredient substitutions (suggest alternatives that work with this recipe's chemistry)
   - Cooking technique explanations (how to dice, sauté, fold, etc.)
   - Timing and temperature questions
   - Scaling the recipe up or down
   - Troubleshooting cooking issues
   - Equipment recommendations
   - Tips for making the dish better
4. Keep answers concise but helpful (2-4 sentences typically)
5. If you suggest a substitution, explain WHY it works
6. Be encouraging and friendly
7. At the end of your response, you may suggest 1-2 relevant follow-up questions the user might have

Format your response as JSON:
{
  "message": "Your helpful response here",
  "suggestions": ["Optional follow-up question 1?", "Optional follow-up question 2?"]
}

Return ONLY valid JSON.`;

    // Build messages array with conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (limit to last 10 messages to stay within context limits)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI with conversation
    const response = await this.callOpenAIChat(messages);

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Chat response generated for "${recipe.title}"`);
      return {
        message: parsed.message,
        suggestions: parsed.suggestions,
      };
    } catch (error) {
      // If JSON parsing fails, return the raw response as message
      this.logger.warn('Failed to parse chat response as JSON, using raw response');
      return {
        message: response.trim(),
      };
    }
  }

  /**
   * Call OpenAI API with full message array (for chat)
   */
  private async callOpenAIChat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`OpenAI API error: ${response.status} - ${error}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Generate a recipe image using DALL-E
   */
  async generateRecipeImage(
    title: string,
    description?: string,
    cuisine?: string,
    category?: string,
    ingredients?: string[],
  ): Promise<{ imageUrl: string }> {
    this.logger.log(`Generating image for recipe: ${title}`);

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build a detailed prompt for food photography
    const cuisineText = cuisine ? `${cuisine} cuisine` : '';
    const categoryText = category ? category.toLowerCase().replace('_', ' ') : '';
    const descText = description ? `. ${description}` : '';

    // Include key ingredients for more accurate visualization (limit to top 5)
    const ingredientText = ingredients && ingredients.length > 0
      ? ` featuring ${ingredients.slice(0, 5).join(', ')}`
      : '';

    const prompt = `Professional food photography of ${title}${descText}${ingredientText}. ${cuisineText} ${categoryText} dish.
Beautiful plating on a rustic wooden table, soft natural lighting, shallow depth of field,
appetizing and delicious looking, high-end restaurant quality presentation,
garnished beautifully, warm inviting colors, 4K quality food photography.`.trim();

    this.logger.log(`DALL-E prompt: ${prompt.substring(0, 200)}...`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`DALL-E API error: ${response.status} - ${error}`);
      throw new Error(`Failed to generate image: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    this.logger.log(`Successfully generated image for recipe: ${title}`);
    return { imageUrl };
  }

  /**
   * Create a fusion recipe by merging two recipes using AI
   */
  async createFusionRecipe(
    recipe1: {
      title: string;
      description?: string;
      cuisine?: string;
      category?: string;
      components: {
        name: string;
        ingredients: { quantity?: number; unit?: string; name: string; notes?: string }[];
        steps: { order: number; instruction: string; duration?: number; tips?: string }[];
      }[];
    },
    recipe2: {
      title: string;
      description?: string;
      cuisine?: string;
      category?: string;
      components: {
        name: string;
        ingredients: { quantity?: number; unit?: string; name: string; notes?: string }[];
        steps: { order: number; instruction: string; duration?: number; tips?: string }[];
      }[];
    },
    fusionStyle?: string,
  ): Promise<any> {
    this.logger.log(`Creating fusion recipe: "${recipe1.title}" + "${recipe2.title}"`);

    // Format recipe data for the prompt
    const formatRecipe = (recipe: typeof recipe1, label: string) => {
      const ingredientsList = recipe.components
        .flatMap((c) =>
          c.ingredients.map((ing) => {
            const qty = ing.quantity ? `${ing.quantity} ` : '';
            const unit = ing.unit ? `${ing.unit} ` : '';
            return `${qty}${unit}${ing.name}`;
          })
        )
        .join('\n  - ');

      const stepsList = recipe.components
        .flatMap((c) => c.steps.map((s) => `${s.order}. ${s.instruction}`))
        .join('\n  ');

      return `${label}:
  Title: ${recipe.title}
  ${recipe.description ? `Description: ${recipe.description}` : ''}
  ${recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : ''}
  ${recipe.category ? `Category: ${recipe.category}` : ''}

  Ingredients:
  - ${ingredientsList}

  Steps:
  ${stepsList}`;
    };

    const styleInstructions = fusionStyle
      ? `\nFusion Style: ${fusionStyle}
${fusionStyle === 'balanced' ? '- Create an equal blend of both recipes' : ''}
${fusionStyle === 'recipe1-dominant' ? '- Keep Recipe 1 as the base, incorporate elements from Recipe 2' : ''}
${fusionStyle === 'recipe2-dominant' ? '- Keep Recipe 2 as the base, incorporate elements from Recipe 1' : ''}
${fusionStyle === 'experimental' ? '- Be creative and experimental, surprise us!' : ''}`
      : '';

    const systemPrompt = `You are a creative fusion chef specializing in combining cuisines and recipes into innovative new dishes. Your task is to merge two recipes into a single, cohesive fusion recipe.

${formatRecipe(recipe1, 'RECIPE 1')}

${formatRecipe(recipe2, 'RECIPE 2')}
${styleInstructions}

Create a NEW fusion recipe that:
1. Combines the best elements of both dishes
2. Creates harmony between different flavor profiles
3. Uses techniques from both cuisines where appropriate
4. Results in a dish that's creative but still practical to cook
5. Has a clever fusion name that hints at both origins

Return a JSON object with this exact structure:
{
  "title": "Creative fusion recipe name",
  "description": "Appetizing description explaining the fusion concept",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "difficulty": "EASY" | "MEDIUM" | "HARD" | "EXPERT",
  "category": "BREAKFAST" | "LUNCH" | "DINNER" | "DESSERT" | "SNACK" | "APPETIZER" | "MAIN_COURSE" | "OTHER",
  "cuisine": "Fusion cuisine description (e.g., 'Italian-Japanese Fusion')",
  "tags": ["fusion", "creative", "and other relevant tags"],
  "components": [
    {
      "name": "Main" or descriptive section name,
      "ingredients": [
        {
          "quantity": number,
          "unit": "unit",
          "name": "ingredient name",
          "notes": "preparation notes or origin (e.g., 'from Recipe 1')" or null,
          "optional": boolean
        }
      ],
      "steps": [
        {
          "order": 1,
          "instruction": "Clear, detailed step",
          "duration": minutes or null,
          "tips": "helpful fusion cooking tip" or null
        }
      ]
    }
  ],
  "fusionNotes": "Brief explanation of how the two recipes were merged and what makes this fusion special",
  "parentRecipes": ["${recipe1.title}", "${recipe2.title}"],
  "confidence": 0.0-1.0
}

Rules:
- Create a genuinely new dish, not just ingredients from both recipes thrown together
- Consider how flavors complement or contrast
- Think about texture combinations
- Respect cooking techniques from both cuisines
- The result should be something you'd want to eat!
- Return ONLY valid JSON, no markdown or explanation`;

    const response = await this.callOpenAI(systemPrompt, 'Create the fusion recipe now.');

    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

      const parsed = JSON.parse(jsonStr.trim());
      this.logger.log(`Successfully created fusion recipe: ${parsed.title}`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse fusion recipe response', error);
      throw new Error('Failed to create fusion recipe. Please try again.');
    }
  }

  /**
   * Get ingredient density information for unit conversion
   * Returns grams per cup and ingredient type (dry/wet/fat/powder)
   */
  async getIngredientDensity(ingredientName: string): Promise<{
    gramsPerCup: number;
    type: 'dry' | 'wet' | 'fat' | 'powder';
    confidence: number;
  }> {
    this.logger.log(`Getting density for ingredient: ${ingredientName}`);

    const systemPrompt = `You are a culinary measurement expert. Given an ingredient name, determine its density (grams per US cup) and type.

Return a JSON object with this exact structure:
{
  "gramsPerCup": number,
  "type": "dry" | "wet" | "fat" | "powder",
  "confidence": 0.0-1.0
}

Type definitions:
- "dry": Solid ingredients like flour, sugar, grains, nuts, dried fruits
- "wet": Liquids like milk, water, oil, juice, honey, syrups
- "fat": Solid fats like butter, shortening, lard, cream cheese
- "powder": Fine powders like cocoa, powdered sugar, spices

Guidelines:
- Use standard US cup = 236.588 ml
- Base values on USDA nutrition database when available
- For liquids, assume density close to water (~240g/cup) unless thicker
- For flour types, typically 120-140g/cup
- For granulated sugar, typically 200g/cup
- Confidence should reflect how certain you are (common ingredients = high, obscure = lower)

Return ONLY valid JSON, no explanation.`;

    try {
      const response = await this.callOpenAI(systemPrompt, `Ingredient: ${ingredientName}`);

      // Clean up response - remove markdown code blocks if present
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const data = JSON.parse(jsonStr);

      // Validate the response
      if (
        typeof data.gramsPerCup !== 'number' ||
        !['dry', 'wet', 'fat', 'powder'].includes(data.type) ||
        typeof data.confidence !== 'number'
      ) {
        throw new Error('Invalid response format');
      }

      this.logger.log(`Got density for ${ingredientName}: ${data.gramsPerCup}g/cup (${data.type})`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to get density for ${ingredientName}:`, error);
      // Return a sensible default for unknown ingredients
      return {
        gramsPerCup: 240, // Close to water density
        type: 'dry',
        confidence: 0.1,
      };
    }
  }
}
