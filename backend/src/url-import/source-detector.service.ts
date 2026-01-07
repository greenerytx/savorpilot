import { Injectable } from '@nestjs/common';
import { UrlSource, SourceDetectionResult } from './dto';

// Known recipe sites that use Schema.org markup (high success rate)
const KNOWN_RECIPE_SITES: Record<string, string> = {
  'allrecipes.com': 'AllRecipes',
  'foodnetwork.com': 'Food Network',
  'epicurious.com': 'Epicurious',
  'seriouseats.com': 'Serious Eats',
  'bonappetit.com': 'Bon Appétit',
  'delish.com': 'Delish',
  'tasty.co': 'Tasty',
  'simplyrecipes.com': 'Simply Recipes',
  'food52.com': 'Food52',
  'cooking.nytimes.com': 'NYT Cooking',
  'thekitchn.com': 'The Kitchn',
  'budgetbytes.com': 'Budget Bytes',
  'cookieandkate.com': 'Cookie and Kate',
  'minimalistbaker.com': 'Minimalist Baker',
  'skinnytaste.com': 'Skinnytaste',
  'damndelicious.net': 'Damn Delicious',
  'pinchofyum.com': 'Pinch of Yum',
  'halfbakedharvest.com': 'Half Baked Harvest',
  'smittenkitchen.com': 'Smitten Kitchen',
  'loveandlemons.com': 'Love and Lemons',
  'sallysbakingaddiction.com': 'Sally\'s Baking Addiction',
  'kingarthurbaking.com': 'King Arthur Baking',
  'barefootcontessa.com': 'Barefoot Contessa',
  'marthastewart.com': 'Martha Stewart',
  'bettycrocker.com': 'Betty Crocker',
  'pillsbury.com': 'Pillsbury',
  'food.com': 'Food.com',
  'yummly.com': 'Yummly',
  'myrecipes.com': 'MyRecipes',
  'eatingwell.com': 'EatingWell',
  'tasteofhome.com': 'Taste of Home',
  'recipetineats.com': 'RecipeTin Eats',
  'justonecookbook.com': 'Just One Cookbook',
  'gimmesomeoven.com': 'Gimme Some Oven',
  'hostthetoast.com': 'Host The Toast',
  'iamafoodblog.com': 'I Am A Food Blog',
  'cafedelites.com': 'Cafe Delites',
  'therecipecritic.com': 'The Recipe Critic',
  'natashaskitchen.com': 'Natasha\'s Kitchen',
  'wellplated.com': 'Well Plated',
  'onceuponachef.com': 'Once Upon a Chef',
  'inspiredtaste.net': 'Inspired Taste',
};

@Injectable()
export class SourceDetectorService {
  /**
   * Detect the source type of a URL
   */
  detectSource(url: string): SourceDetectionResult {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase().replace('www.', '');
      const pathname = parsedUrl.pathname.toLowerCase();

      // Check for social platforms first
      if (this.isInstagram(hostname)) {
        return { source: UrlSource.INSTAGRAM, isKnownRecipeSite: false };
      }

      if (this.isFacebook(hostname)) {
        return { source: UrlSource.FACEBOOK, isKnownRecipeSite: false };
      }

      if (this.isYouTube(hostname)) {
        return { source: UrlSource.YOUTUBE, isKnownRecipeSite: false };
      }

      if (this.isTikTok(hostname)) {
        return { source: UrlSource.TIKTOK, isKnownRecipeSite: false };
      }

      // Check for PDF
      if (pathname.endsWith('.pdf') || url.toLowerCase().includes('.pdf')) {
        return { source: UrlSource.PDF, isKnownRecipeSite: false };
      }

      // Check known recipe sites
      const knownSite = this.findKnownRecipeSite(hostname);
      if (knownSite) {
        return {
          source: UrlSource.RECIPE_SITE,
          isKnownRecipeSite: true,
          siteName: knownSite,
        };
      }

      // Default to generic website
      return { source: UrlSource.GENERIC_WEBSITE, isKnownRecipeSite: false };
    } catch {
      return { source: UrlSource.GENERIC_WEBSITE, isKnownRecipeSite: false };
    }
  }

  private isInstagram(hostname: string): boolean {
    return hostname.includes('instagram.com') || hostname === 'instagr.am';
  }

  private isFacebook(hostname: string): boolean {
    return (
      hostname.includes('facebook.com') ||
      hostname.includes('fb.com') ||
      hostname.includes('fb.watch') ||
      hostname.includes('fbcdn.net')
    );
  }

  private isYouTube(hostname: string): boolean {
    return (
      hostname.includes('youtube.com') ||
      hostname.includes('youtu.be') ||
      hostname.includes('youtube-nocookie.com')
    );
  }

  private isTikTok(hostname: string): boolean {
    return hostname.includes('tiktok.com') || hostname.includes('vm.tiktok.com');
  }

  private findKnownRecipeSite(hostname: string): string | null {
    // Check direct match
    if (KNOWN_RECIPE_SITES[hostname]) {
      return KNOWN_RECIPE_SITES[hostname];
    }

    // Check subdomain matches (e.g., recipes.example.com)
    for (const [domain, name] of Object.entries(KNOWN_RECIPE_SITES)) {
      if (hostname.endsWith(`.${domain}`) || hostname === domain) {
        return name;
      }
    }

    return null;
  }

  /**
   * Get list of known recipe sites for frontend display
   */
  getKnownRecipeSites(): Array<{ domain: string; name: string }> {
    return Object.entries(KNOWN_RECIPE_SITES).map(([domain, name]) => ({
      domain,
      name,
    }));
  }
}
