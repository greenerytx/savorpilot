/**
 * Ingredient Density Database
 *
 * Maps common ingredients to their cup-to-gram conversion ratios.
 * Used for intelligent unit conversion (cups → grams for dry, cups → ml for wet).
 */

export type IngredientType = 'dry' | 'wet' | 'fat' | 'powder';

export interface IngredientDensity {
  gramsPerCup: number;
  type: IngredientType;
  aliases?: string[];
}

/**
 * Comprehensive ingredient density database
 * Values are grams per 1 US cup (236.588 ml)
 *
 * Sources: USDA, King Arthur Flour, various culinary references
 */
export const INGREDIENT_DENSITIES: Record<string, IngredientDensity> = {
  // ==================== FLOURS (14 entries) ====================
  'all-purpose flour': { gramsPerCup: 125, type: 'dry', aliases: ['flour', 'ap flour', 'plain flour', 'white flour', 'unbleached flour'] },
  'bread flour': { gramsPerCup: 127, type: 'dry', aliases: ['strong flour', 'high gluten flour'] },
  'cake flour': { gramsPerCup: 114, type: 'dry', aliases: ['pastry flour', 'soft flour'] },
  'whole wheat flour': { gramsPerCup: 128, type: 'dry', aliases: ['wholemeal flour', 'whole grain flour', 'graham flour'] },
  'self-rising flour': { gramsPerCup: 125, type: 'dry', aliases: ['self raising flour'] },
  'almond flour': { gramsPerCup: 96, type: 'dry', aliases: ['almond meal', 'ground almonds', 'blanched almond flour'] },
  'coconut flour': { gramsPerCup: 112, type: 'dry' },
  'oat flour': { gramsPerCup: 92, type: 'dry', aliases: ['ground oats'] },
  'rye flour': { gramsPerCup: 102, type: 'dry', aliases: ['dark rye flour', 'light rye flour'] },
  'spelt flour': { gramsPerCup: 125, type: 'dry' },
  'buckwheat flour': { gramsPerCup: 120, type: 'dry' },
  'semolina': { gramsPerCup: 167, type: 'dry', aliases: ['semolina flour', 'durum semolina'] },
  'cornmeal': { gramsPerCup: 138, type: 'dry', aliases: ['polenta', 'yellow cornmeal', 'white cornmeal'] },
  'cornstarch': { gramsPerCup: 128, type: 'powder', aliases: ['corn starch', 'cornflour', 'maize starch'] },
  'tapioca flour': { gramsPerCup: 120, type: 'powder', aliases: ['tapioca starch', 'cassava flour'] },
  'rice flour': { gramsPerCup: 158, type: 'dry', aliases: ['white rice flour'] },
  'glutinous rice flour': { gramsPerCup: 150, type: 'dry', aliases: ['sweet rice flour', 'mochiko'] },
  'chickpea flour': { gramsPerCup: 92, type: 'dry', aliases: ['gram flour', 'besan', 'garbanzo flour'] },
  'potato flour': { gramsPerCup: 160, type: 'dry' },
  'potato starch': { gramsPerCup: 150, type: 'powder' },
  'arrowroot': { gramsPerCup: 128, type: 'powder', aliases: ['arrowroot starch', 'arrowroot flour'] },
  'sorghum flour': { gramsPerCup: 136, type: 'dry' },
  'teff flour': { gramsPerCup: 140, type: 'dry' },
  'millet flour': { gramsPerCup: 138, type: 'dry' },

  // ==================== SUGARS & SWEETENERS (18 entries) ====================
  'granulated sugar': { gramsPerCup: 200, type: 'dry', aliases: ['sugar', 'white sugar', 'caster sugar', 'castor sugar', 'table sugar'] },
  'brown sugar': { gramsPerCup: 220, type: 'dry', aliases: ['light brown sugar', 'dark brown sugar', 'packed brown sugar'] },
  'powdered sugar': { gramsPerCup: 120, type: 'powder', aliases: ['confectioners sugar', 'icing sugar', 'confectioner\'s sugar', '10x sugar'] },
  'turbinado sugar': { gramsPerCup: 200, type: 'dry', aliases: ['raw sugar', 'demerara sugar'] },
  'muscovado sugar': { gramsPerCup: 220, type: 'dry', aliases: ['dark muscovado'] },
  'palm sugar': { gramsPerCup: 180, type: 'dry', aliases: ['jaggery', 'gur'] },
  'coconut sugar': { gramsPerCup: 180, type: 'dry', aliases: ['coconut palm sugar'] },
  'honey': { gramsPerCup: 340, type: 'wet', aliases: ['raw honey', 'clover honey'] },
  'maple syrup': { gramsPerCup: 322, type: 'wet', aliases: ['pure maple syrup'] },
  'molasses': { gramsPerCup: 328, type: 'wet', aliases: ['treacle', 'blackstrap molasses', 'dark molasses'] },
  'corn syrup': { gramsPerCup: 328, type: 'wet', aliases: ['light corn syrup', 'dark corn syrup', 'karo'] },
  'golden syrup': { gramsPerCup: 340, type: 'wet', aliases: ['lyle\'s golden syrup'] },
  'agave': { gramsPerCup: 336, type: 'wet', aliases: ['agave nectar', 'agave syrup', 'blue agave'] },
  'rice syrup': { gramsPerCup: 320, type: 'wet', aliases: ['brown rice syrup'] },
  'date syrup': { gramsPerCup: 330, type: 'wet', aliases: ['silan'] },
  'stevia': { gramsPerCup: 48, type: 'powder', aliases: ['stevia powder'] },
  'erythritol': { gramsPerCup: 180, type: 'dry' },
  'xylitol': { gramsPerCup: 190, type: 'dry' },

  // ==================== DAIRY (22 entries) ====================
  'butter': { gramsPerCup: 227, type: 'fat', aliases: ['unsalted butter', 'salted butter', 'softened butter', 'melted butter'] },
  'clarified butter': { gramsPerCup: 220, type: 'fat', aliases: ['ghee'] },
  'milk': { gramsPerCup: 245, type: 'wet', aliases: ['whole milk', '2% milk', 'skim milk', 'low fat milk', 'full fat milk'] },
  'heavy cream': { gramsPerCup: 238, type: 'wet', aliases: ['whipping cream', 'double cream', 'heavy whipping cream', 'thick cream'] },
  'light cream': { gramsPerCup: 240, type: 'wet', aliases: ['single cream', 'coffee cream', 'table cream'] },
  'half and half': { gramsPerCup: 242, type: 'wet', aliases: ['half & half'] },
  'sour cream': { gramsPerCup: 242, type: 'wet', aliases: ['creme fraiche'] },
  'yogurt': { gramsPerCup: 245, type: 'wet', aliases: ['plain yogurt', 'yoghurt'] },
  'greek yogurt': { gramsPerCup: 280, type: 'wet', aliases: ['strained yogurt', 'thick yogurt'] },
  'cream cheese': { gramsPerCup: 232, type: 'fat', aliases: ['softened cream cheese', 'philadelphia'] },
  'mascarpone': { gramsPerCup: 240, type: 'fat', aliases: ['mascarpone cheese'] },
  'ricotta': { gramsPerCup: 246, type: 'wet', aliases: ['ricotta cheese', 'whole milk ricotta'] },
  'cottage cheese': { gramsPerCup: 226, type: 'wet', aliases: ['small curd cottage cheese', 'large curd cottage cheese'] },
  'buttermilk': { gramsPerCup: 245, type: 'wet', aliases: ['cultured buttermilk'] },
  'evaporated milk': { gramsPerCup: 252, type: 'wet', aliases: ['carnation milk'] },
  'condensed milk': { gramsPerCup: 306, type: 'wet', aliases: ['sweetened condensed milk'] },
  'dry milk powder': { gramsPerCup: 68, type: 'powder', aliases: ['milk powder', 'powdered milk', 'nonfat dry milk'] },
  'coconut milk': { gramsPerCup: 230, type: 'wet', aliases: ['canned coconut milk', 'full fat coconut milk'] },
  'coconut cream': { gramsPerCup: 280, type: 'wet', aliases: ['thick coconut cream'] },
  'almond milk': { gramsPerCup: 240, type: 'wet', aliases: ['unsweetened almond milk'] },
  'oat milk': { gramsPerCup: 245, type: 'wet' },
  'soy milk': { gramsPerCup: 243, type: 'wet', aliases: ['soymilk'] },

  // ==================== OILS & FATS (14 entries) ====================
  'vegetable oil': { gramsPerCup: 218, type: 'wet', aliases: ['oil', 'canola oil', 'sunflower oil', 'neutral oil'] },
  'olive oil': { gramsPerCup: 216, type: 'wet', aliases: ['extra virgin olive oil', 'evoo', 'light olive oil'] },
  'coconut oil': { gramsPerCup: 218, type: 'fat', aliases: ['virgin coconut oil', 'refined coconut oil'] },
  'sesame oil': { gramsPerCup: 218, type: 'wet', aliases: ['toasted sesame oil', 'dark sesame oil'] },
  'avocado oil': { gramsPerCup: 218, type: 'wet' },
  'grapeseed oil': { gramsPerCup: 218, type: 'wet', aliases: ['grape seed oil'] },
  'peanut oil': { gramsPerCup: 218, type: 'wet', aliases: ['groundnut oil'] },
  'walnut oil': { gramsPerCup: 218, type: 'wet' },
  'flaxseed oil': { gramsPerCup: 218, type: 'wet', aliases: ['linseed oil'] },
  'shortening': { gramsPerCup: 205, type: 'fat', aliases: ['vegetable shortening', 'crisco'] },
  'lard': { gramsPerCup: 205, type: 'fat', aliases: ['pork fat'] },
  'duck fat': { gramsPerCup: 210, type: 'fat' },
  'bacon fat': { gramsPerCup: 210, type: 'fat', aliases: ['bacon grease', 'bacon drippings'] },
  'margarine': { gramsPerCup: 227, type: 'fat' },

  // ==================== GRAINS & STARCHES (28 entries) ====================
  'rice': { gramsPerCup: 185, type: 'dry', aliases: ['white rice', 'basmati rice', 'jasmine rice', 'long grain rice', 'short grain rice'] },
  'brown rice': { gramsPerCup: 190, type: 'dry', aliases: ['whole grain rice'] },
  'wild rice': { gramsPerCup: 160, type: 'dry' },
  'arborio rice': { gramsPerCup: 200, type: 'dry', aliases: ['risotto rice', 'carnaroli'] },
  'sushi rice': { gramsPerCup: 200, type: 'dry', aliases: ['calrose rice'] },
  'oats': { gramsPerCup: 90, type: 'dry', aliases: ['rolled oats', 'old fashioned oats'] },
  'quick oats': { gramsPerCup: 80, type: 'dry', aliases: ['instant oats', 'minute oats'] },
  'steel cut oats': { gramsPerCup: 160, type: 'dry', aliases: ['irish oats', 'pinhead oats'] },
  'quinoa': { gramsPerCup: 170, type: 'dry', aliases: ['white quinoa', 'red quinoa', 'black quinoa'] },
  'couscous': { gramsPerCup: 173, type: 'dry', aliases: ['israeli couscous', 'pearl couscous'] },
  'bulgur': { gramsPerCup: 140, type: 'dry', aliases: ['bulgur wheat', 'cracked wheat'] },
  'farro': { gramsPerCup: 180, type: 'dry', aliases: ['emmer'] },
  'barley': { gramsPerCup: 184, type: 'dry', aliases: ['pearl barley', 'hulled barley'] },
  'millet': { gramsPerCup: 200, type: 'dry' },
  'buckwheat': { gramsPerCup: 164, type: 'dry', aliases: ['kasha', 'buckwheat groats'] },
  'wheat berries': { gramsPerCup: 184, type: 'dry' },
  'freekeh': { gramsPerCup: 170, type: 'dry' },
  'breadcrumbs': { gramsPerCup: 108, type: 'dry', aliases: ['bread crumbs', 'dry breadcrumbs', 'plain breadcrumbs'] },
  'panko': { gramsPerCup: 60, type: 'dry', aliases: ['panko breadcrumbs', 'japanese breadcrumbs'] },
  'pasta': { gramsPerCup: 100, type: 'dry', aliases: ['dry pasta', 'macaroni', 'penne', 'spaghetti', 'fusilli', 'rigatoni'] },
  'orzo': { gramsPerCup: 170, type: 'dry', aliases: ['risoni'] },
  'egg noodles': { gramsPerCup: 100, type: 'dry' },
  'rice noodles': { gramsPerCup: 85, type: 'dry', aliases: ['vermicelli', 'pad thai noodles'] },
  'ramen noodles': { gramsPerCup: 85, type: 'dry' },
  'polenta': { gramsPerCup: 163, type: 'dry', aliases: ['coarse cornmeal'] },
  'grits': { gramsPerCup: 156, type: 'dry', aliases: ['hominy grits', 'corn grits'] },
  'cream of wheat': { gramsPerCup: 167, type: 'dry', aliases: ['farina'] },
  'tapioca pearls': { gramsPerCup: 152, type: 'dry', aliases: ['boba', 'sago'] },

  // ==================== NUTS & SEEDS (32 entries) ====================
  'almonds': { gramsPerCup: 143, type: 'dry', aliases: ['whole almonds', 'raw almonds'] },
  'sliced almonds': { gramsPerCup: 92, type: 'dry', aliases: ['flaked almonds'] },
  'slivered almonds': { gramsPerCup: 108, type: 'dry' },
  'chopped almonds': { gramsPerCup: 130, type: 'dry' },
  'walnuts': { gramsPerCup: 120, type: 'dry', aliases: ['walnut pieces', 'walnut halves'] },
  'chopped walnuts': { gramsPerCup: 108, type: 'dry' },
  'pecans': { gramsPerCup: 109, type: 'dry', aliases: ['pecan pieces', 'pecan halves'] },
  'chopped pecans': { gramsPerCup: 100, type: 'dry' },
  'cashews': { gramsPerCup: 137, type: 'dry', aliases: ['whole cashews', 'raw cashews'] },
  'peanuts': { gramsPerCup: 146, type: 'dry', aliases: ['unsalted peanuts', 'roasted peanuts'] },
  'hazelnuts': { gramsPerCup: 135, type: 'dry', aliases: ['filberts', 'whole hazelnuts'] },
  'macadamia nuts': { gramsPerCup: 134, type: 'dry', aliases: ['macadamias'] },
  'pistachios': { gramsPerCup: 123, type: 'dry', aliases: ['shelled pistachios'] },
  'brazil nuts': { gramsPerCup: 140, type: 'dry' },
  'pine nuts': { gramsPerCup: 135, type: 'dry', aliases: ['pignoli', 'pinon nuts'] },
  'chestnuts': { gramsPerCup: 150, type: 'dry', aliases: ['roasted chestnuts'] },
  'mixed nuts': { gramsPerCup: 135, type: 'dry' },
  'sunflower seeds': { gramsPerCup: 140, type: 'dry', aliases: ['sunflower kernels'] },
  'pumpkin seeds': { gramsPerCup: 129, type: 'dry', aliases: ['pepitas', 'hulled pumpkin seeds'] },
  'chia seeds': { gramsPerCup: 170, type: 'dry' },
  'flax seeds': { gramsPerCup: 150, type: 'dry', aliases: ['flaxseed', 'linseed', 'whole flax seeds'] },
  'ground flax': { gramsPerCup: 112, type: 'dry', aliases: ['flaxseed meal', 'ground flaxseed'] },
  'sesame seeds': { gramsPerCup: 144, type: 'dry', aliases: ['white sesame seeds', 'black sesame seeds'] },
  'hemp seeds': { gramsPerCup: 160, type: 'dry', aliases: ['hemp hearts'] },
  'poppy seeds': { gramsPerCup: 145, type: 'dry' },
  'caraway seeds': { gramsPerCup: 150, type: 'dry' },
  'peanut butter': { gramsPerCup: 258, type: 'fat', aliases: ['smooth peanut butter', 'chunky peanut butter', 'creamy peanut butter'] },
  'almond butter': { gramsPerCup: 250, type: 'fat' },
  'cashew butter': { gramsPerCup: 256, type: 'fat' },
  'sunflower seed butter': { gramsPerCup: 256, type: 'fat', aliases: ['sunbutter'] },
  'tahini': { gramsPerCup: 238, type: 'fat', aliases: ['sesame paste', 'sesame tahini'] },
  'nutella': { gramsPerCup: 270, type: 'fat', aliases: ['hazelnut spread', 'chocolate hazelnut spread'] },

  // ==================== CHOCOLATE & COCOA (12 entries) ====================
  'cocoa powder': { gramsPerCup: 85, type: 'powder', aliases: ['cocoa', 'unsweetened cocoa', 'dutch process cocoa', 'natural cocoa'] },
  'chocolate chips': { gramsPerCup: 170, type: 'dry', aliases: ['chocolate morsels', 'semi-sweet chips', 'dark chocolate chips', 'milk chocolate chips'] },
  'mini chocolate chips': { gramsPerCup: 177, type: 'dry' },
  'white chocolate chips': { gramsPerCup: 170, type: 'dry' },
  'chopped chocolate': { gramsPerCup: 170, type: 'dry', aliases: ['chocolate chunks'] },
  'cacao nibs': { gramsPerCup: 120, type: 'dry', aliases: ['cocoa nibs'] },
  'cacao powder': { gramsPerCup: 85, type: 'powder', aliases: ['raw cacao'] },
  'chocolate shavings': { gramsPerCup: 60, type: 'dry', aliases: ['chocolate curls'] },
  'chocolate syrup': { gramsPerCup: 312, type: 'wet', aliases: ['hershey\'s syrup'] },
  'hot cocoa mix': { gramsPerCup: 110, type: 'powder', aliases: ['hot chocolate mix'] },
  'carob powder': { gramsPerCup: 90, type: 'powder', aliases: ['carob'] },
  'carob chips': { gramsPerCup: 170, type: 'dry' },

  // ==================== DRIED FRUITS (24 entries) ====================
  'raisins': { gramsPerCup: 145, type: 'dry', aliases: ['seedless raisins', 'golden raisins', 'sultanas'] },
  'dried cranberries': { gramsPerCup: 120, type: 'dry', aliases: ['craisins', 'sweetened cranberries'] },
  'dried cherries': { gramsPerCup: 140, type: 'dry', aliases: ['tart cherries', 'dried tart cherries'] },
  'dried blueberries': { gramsPerCup: 140, type: 'dry' },
  'dried apricots': { gramsPerCup: 130, type: 'dry', aliases: ['chopped dried apricots'] },
  'dried mango': { gramsPerCup: 160, type: 'dry' },
  'dried pineapple': { gramsPerCup: 140, type: 'dry' },
  'dried papaya': { gramsPerCup: 140, type: 'dry' },
  'dates': { gramsPerCup: 147, type: 'dry', aliases: ['chopped dates', 'medjool dates', 'deglet noor dates', 'pitted dates'] },
  'dried figs': { gramsPerCup: 149, type: 'dry', aliases: ['chopped figs', 'mission figs'] },
  'prunes': { gramsPerCup: 161, type: 'dry', aliases: ['dried plums', 'pitted prunes'] },
  'currants': { gramsPerCup: 144, type: 'dry', aliases: ['zante currants', 'dried currants'] },
  'dried apple': { gramsPerCup: 86, type: 'dry', aliases: ['apple rings', 'dried apple rings'] },
  'dried banana': { gramsPerCup: 100, type: 'dry', aliases: ['banana chips'] },
  'goji berries': { gramsPerCup: 113, type: 'dry', aliases: ['dried goji berries', 'wolfberries'] },
  'mulberries': { gramsPerCup: 100, type: 'dry', aliases: ['dried mulberries'] },
  'dried coconut': { gramsPerCup: 85, type: 'dry', aliases: ['shredded coconut', 'desiccated coconut', 'coconut flakes', 'unsweetened coconut'] },
  'sweetened coconut': { gramsPerCup: 93, type: 'dry', aliases: ['sweetened shredded coconut'] },
  'candied ginger': { gramsPerCup: 200, type: 'dry', aliases: ['crystallized ginger'] },
  'candied citrus peel': { gramsPerCup: 170, type: 'dry', aliases: ['candied orange peel', 'candied lemon peel'] },
  'dried tomatoes': { gramsPerCup: 110, type: 'dry', aliases: ['sun dried tomatoes', 'sun-dried tomatoes'] },
  'dried mushrooms': { gramsPerCup: 30, type: 'dry', aliases: ['dried shiitake', 'dried porcini'] },
  'freeze dried fruit': { gramsPerCup: 40, type: 'dry', aliases: ['freeze dried strawberries', 'freeze dried raspberries'] },
  'trail mix': { gramsPerCup: 150, type: 'dry' },

  // ==================== FRESH PRODUCE (50 entries) ====================
  'blueberries': { gramsPerCup: 148, type: 'wet', aliases: ['fresh blueberries'] },
  'raspberries': { gramsPerCup: 123, type: 'wet', aliases: ['fresh raspberries'] },
  'blackberries': { gramsPerCup: 144, type: 'wet', aliases: ['fresh blackberries'] },
  'strawberries': { gramsPerCup: 152, type: 'wet', aliases: ['sliced strawberries', 'whole strawberries'] },
  'cranberries': { gramsPerCup: 100, type: 'wet', aliases: ['fresh cranberries'] },
  'cherries': { gramsPerCup: 138, type: 'wet', aliases: ['pitted cherries', 'fresh cherries'] },
  'grapes': { gramsPerCup: 151, type: 'wet', aliases: ['seedless grapes'] },
  'pomegranate seeds': { gramsPerCup: 174, type: 'wet', aliases: ['pomegranate arils'] },
  'mashed banana': { gramsPerCup: 225, type: 'wet', aliases: ['banana', 'ripe banana'] },
  'sliced banana': { gramsPerCup: 150, type: 'wet' },
  'diced apple': { gramsPerCup: 125, type: 'wet', aliases: ['chopped apple'] },
  'diced pear': { gramsPerCup: 140, type: 'wet', aliases: ['chopped pear'] },
  'diced peach': { gramsPerCup: 154, type: 'wet', aliases: ['chopped peach', 'sliced peaches'] },
  'diced mango': { gramsPerCup: 165, type: 'wet', aliases: ['chopped mango', 'fresh mango'] },
  'diced pineapple': { gramsPerCup: 155, type: 'wet', aliases: ['pineapple chunks', 'fresh pineapple'] },
  'applesauce': { gramsPerCup: 244, type: 'wet', aliases: ['apple sauce', 'unsweetened applesauce'] },
  'pumpkin puree': { gramsPerCup: 245, type: 'wet', aliases: ['canned pumpkin', 'pumpkin pulp'] },
  'butternut squash puree': { gramsPerCup: 245, type: 'wet' },
  'sweet potato puree': { gramsPerCup: 255, type: 'wet', aliases: ['mashed sweet potato'] },
  'mashed potatoes': { gramsPerCup: 210, type: 'wet' },
  'diced potatoes': { gramsPerCup: 150, type: 'wet', aliases: ['cubed potatoes', 'potato cubes'] },
  'shredded potatoes': { gramsPerCup: 110, type: 'dry', aliases: ['hash browns'] },
  'avocado': { gramsPerCup: 230, type: 'wet', aliases: ['mashed avocado', 'diced avocado'] },
  'spinach': { gramsPerCup: 30, type: 'dry', aliases: ['fresh spinach', 'baby spinach', 'raw spinach'] },
  'cooked spinach': { gramsPerCup: 180, type: 'wet' },
  'kale': { gramsPerCup: 67, type: 'dry', aliases: ['chopped kale', 'raw kale', 'baby kale'] },
  'arugula': { gramsPerCup: 20, type: 'dry', aliases: ['rocket', 'baby arugula'] },
  'lettuce': { gramsPerCup: 36, type: 'dry', aliases: ['romaine', 'iceberg lettuce', 'mixed greens'] },
  'cabbage': { gramsPerCup: 89, type: 'dry', aliases: ['shredded cabbage', 'chopped cabbage'] },
  'broccoli': { gramsPerCup: 91, type: 'dry', aliases: ['broccoli florets', 'chopped broccoli'] },
  'cauliflower': { gramsPerCup: 100, type: 'dry', aliases: ['cauliflower florets'] },
  'brussels sprouts': { gramsPerCup: 88, type: 'dry', aliases: ['brussel sprouts'] },
  'green beans': { gramsPerCup: 100, type: 'dry', aliases: ['string beans', 'snap beans'] },
  'peas': { gramsPerCup: 145, type: 'wet', aliases: ['green peas', 'garden peas'] },
  'corn': { gramsPerCup: 164, type: 'wet', aliases: ['corn kernels', 'sweet corn'] },
  'carrots': { gramsPerCup: 128, type: 'dry', aliases: ['shredded carrots', 'chopped carrots', 'diced carrots'] },
  'celery': { gramsPerCup: 101, type: 'dry', aliases: ['diced celery', 'chopped celery'] },
  'onion': { gramsPerCup: 160, type: 'dry', aliases: ['diced onion', 'chopped onion', 'minced onion'] },
  'green onion': { gramsPerCup: 100, type: 'dry', aliases: ['scallions', 'spring onions', 'sliced green onions'] },
  'leeks': { gramsPerCup: 89, type: 'dry', aliases: ['sliced leeks', 'chopped leeks'] },
  'shallots': { gramsPerCup: 150, type: 'dry', aliases: ['minced shallots', 'diced shallots'] },
  'garlic': { gramsPerCup: 136, type: 'dry', aliases: ['minced garlic', 'chopped garlic'] },
  'bell pepper': { gramsPerCup: 149, type: 'dry', aliases: ['diced bell pepper', 'chopped pepper', 'capsicum'] },
  'jalapeno': { gramsPerCup: 90, type: 'dry', aliases: ['diced jalapeno', 'sliced jalapeno'] },
  'mushrooms': { gramsPerCup: 70, type: 'dry', aliases: ['sliced mushrooms', 'chopped mushrooms', 'white mushrooms', 'cremini'] },
  'zucchini': { gramsPerCup: 124, type: 'wet', aliases: ['shredded zucchini', 'diced zucchini', 'courgette'] },
  'tomatoes': { gramsPerCup: 180, type: 'wet', aliases: ['diced tomatoes', 'chopped tomatoes', 'fresh tomatoes'] },
  'cherry tomatoes': { gramsPerCup: 149, type: 'wet', aliases: ['grape tomatoes', 'halved cherry tomatoes'] },
  'cucumber': { gramsPerCup: 104, type: 'wet', aliases: ['diced cucumber', 'sliced cucumber'] },
  'eggplant': { gramsPerCup: 82, type: 'dry', aliases: ['diced eggplant', 'aubergine'] },

  // ==================== LIQUIDS (26 entries) ====================
  'water': { gramsPerCup: 237, type: 'wet' },
  'orange juice': { gramsPerCup: 248, type: 'wet', aliases: ['fresh orange juice', 'oj'] },
  'apple juice': { gramsPerCup: 248, type: 'wet', aliases: ['apple cider'] },
  'grape juice': { gramsPerCup: 253, type: 'wet' },
  'cranberry juice': { gramsPerCup: 253, type: 'wet' },
  'pineapple juice': { gramsPerCup: 250, type: 'wet' },
  'lemon juice': { gramsPerCup: 244, type: 'wet', aliases: ['fresh lemon juice'] },
  'lime juice': { gramsPerCup: 244, type: 'wet', aliases: ['fresh lime juice'] },
  'pomegranate juice': { gramsPerCup: 253, type: 'wet' },
  'tomato juice': { gramsPerCup: 243, type: 'wet' },
  'carrot juice': { gramsPerCup: 236, type: 'wet' },
  'broth': { gramsPerCup: 240, type: 'wet', aliases: ['stock', 'chicken broth', 'beef broth', 'vegetable broth', 'bone broth'] },
  'wine': { gramsPerCup: 235, type: 'wet', aliases: ['white wine', 'red wine', 'cooking wine'] },
  'beer': { gramsPerCup: 240, type: 'wet' },
  'sake': { gramsPerCup: 240, type: 'wet', aliases: ['rice wine'] },
  'rum': { gramsPerCup: 230, type: 'wet' },
  'coffee': { gramsPerCup: 237, type: 'wet', aliases: ['brewed coffee', 'espresso'] },
  'tea': { gramsPerCup: 237, type: 'wet', aliases: ['brewed tea'] },
  'coconut water': { gramsPerCup: 240, type: 'wet' },
  'soy sauce': { gramsPerCup: 255, type: 'wet', aliases: ['shoyu', 'tamari'] },
  'fish sauce': { gramsPerCup: 270, type: 'wet', aliases: ['nam pla'] },
  'worcestershire sauce': { gramsPerCup: 270, type: 'wet' },
  'vinegar': { gramsPerCup: 238, type: 'wet', aliases: ['white vinegar', 'distilled vinegar'] },
  'apple cider vinegar': { gramsPerCup: 239, type: 'wet', aliases: ['acv'] },
  'balsamic vinegar': { gramsPerCup: 255, type: 'wet', aliases: ['balsamic'] },
  'rice vinegar': { gramsPerCup: 235, type: 'wet', aliases: ['rice wine vinegar'] },

  // ==================== LEAVENING, SPICES & BAKING (28 entries) ====================
  'baking powder': { gramsPerCup: 230, type: 'powder' },
  'baking soda': { gramsPerCup: 220, type: 'powder', aliases: ['bicarbonate of soda', 'bicarb'] },
  'cream of tartar': { gramsPerCup: 150, type: 'powder' },
  'yeast': { gramsPerCup: 150, type: 'dry', aliases: ['active dry yeast', 'instant yeast', 'bread machine yeast'] },
  'fresh yeast': { gramsPerCup: 200, type: 'wet', aliases: ['cake yeast', 'compressed yeast'] },
  'salt': { gramsPerCup: 288, type: 'dry', aliases: ['table salt'] },
  'kosher salt': { gramsPerCup: 240, type: 'dry', aliases: ['coarse salt'] },
  'sea salt': { gramsPerCup: 227, type: 'dry' },
  'flaky salt': { gramsPerCup: 150, type: 'dry', aliases: ['maldon salt', 'finishing salt'] },
  'black pepper': { gramsPerCup: 116, type: 'dry', aliases: ['ground pepper', 'ground black pepper'] },
  'cinnamon': { gramsPerCup: 125, type: 'powder', aliases: ['ground cinnamon'] },
  'nutmeg': { gramsPerCup: 112, type: 'powder', aliases: ['ground nutmeg'] },
  'ginger': { gramsPerCup: 96, type: 'powder', aliases: ['ground ginger'] },
  'paprika': { gramsPerCup: 109, type: 'powder', aliases: ['sweet paprika', 'smoked paprika'] },
  'chili powder': { gramsPerCup: 128, type: 'powder', aliases: ['chile powder'] },
  'cayenne': { gramsPerCup: 90, type: 'powder', aliases: ['cayenne pepper', 'ground cayenne'] },
  'cumin': { gramsPerCup: 120, type: 'powder', aliases: ['ground cumin'] },
  'turmeric': { gramsPerCup: 135, type: 'powder', aliases: ['ground turmeric'] },
  'curry powder': { gramsPerCup: 110, type: 'powder' },
  'garlic powder': { gramsPerCup: 155, type: 'powder', aliases: ['granulated garlic'] },
  'onion powder': { gramsPerCup: 115, type: 'powder', aliases: ['granulated onion'] },
  'vanilla extract': { gramsPerCup: 208, type: 'wet', aliases: ['vanilla', 'pure vanilla extract'] },
  'almond extract': { gramsPerCup: 208, type: 'wet' },
  'vanilla bean paste': { gramsPerCup: 300, type: 'wet' },
  'espresso powder': { gramsPerCup: 85, type: 'powder', aliases: ['instant espresso'] },
  'matcha': { gramsPerCup: 85, type: 'powder', aliases: ['matcha powder', 'green tea powder'] },
  'gelatin': { gramsPerCup: 150, type: 'powder', aliases: ['unflavored gelatin', 'powdered gelatin'] },
  'agar agar': { gramsPerCup: 150, type: 'powder', aliases: ['agar'] },

  // ==================== CHEESE (18 entries) ====================
  'shredded cheese': { gramsPerCup: 113, type: 'dry', aliases: ['grated cheese'] },
  'shredded cheddar': { gramsPerCup: 113, type: 'dry', aliases: ['cheddar', 'grated cheddar'] },
  'shredded mozzarella': { gramsPerCup: 113, type: 'dry', aliases: ['mozzarella', 'grated mozzarella'] },
  'shredded monterey jack': { gramsPerCup: 113, type: 'dry', aliases: ['jack cheese'] },
  'shredded swiss': { gramsPerCup: 108, type: 'dry', aliases: ['swiss cheese', 'gruyere'] },
  'shredded parmesan': { gramsPerCup: 100, type: 'dry', aliases: ['parmesan', 'grated parmesan', 'parmigiano reggiano'] },
  'shredded pecorino': { gramsPerCup: 100, type: 'dry', aliases: ['pecorino romano'] },
  'shredded asiago': { gramsPerCup: 100, type: 'dry' },
  'crumbled feta': { gramsPerCup: 150, type: 'dry', aliases: ['feta cheese', 'feta'] },
  'crumbled blue cheese': { gramsPerCup: 135, type: 'dry', aliases: ['blue cheese', 'gorgonzola'] },
  'crumbled goat cheese': { gramsPerCup: 120, type: 'dry', aliases: ['goat cheese', 'chevre'] },
  'crumbled queso fresco': { gramsPerCup: 130, type: 'dry', aliases: ['queso fresco', 'cotija'] },
  'cubed cheese': { gramsPerCup: 140, type: 'dry', aliases: ['cheese cubes'] },
  'sliced cheese': { gramsPerCup: 170, type: 'dry' },
  'velveeta': { gramsPerCup: 240, type: 'wet', aliases: ['american cheese', 'processed cheese'] },
  'nutritional yeast': { gramsPerCup: 60, type: 'dry', aliases: ['nooch'] },
  'paneer': { gramsPerCup: 140, type: 'dry', aliases: ['indian cheese'] },
  'halloumi': { gramsPerCup: 140, type: 'dry' },

  // ==================== BEANS & LEGUMES (20 entries) ====================
  'black beans': { gramsPerCup: 172, type: 'dry', aliases: ['canned black beans', 'cooked black beans'] },
  'pinto beans': { gramsPerCup: 171, type: 'dry', aliases: ['canned pinto beans'] },
  'navy beans': { gramsPerCup: 182, type: 'dry', aliases: ['small white beans'] },
  'great northern beans': { gramsPerCup: 179, type: 'dry' },
  'cannellini beans': { gramsPerCup: 179, type: 'dry', aliases: ['white kidney beans'] },
  'kidney beans': { gramsPerCup: 177, type: 'dry', aliases: ['red kidney beans', 'canned kidney beans'] },
  'chickpeas': { gramsPerCup: 164, type: 'dry', aliases: ['garbanzo beans', 'canned chickpeas'] },
  'lentils': { gramsPerCup: 192, type: 'dry', aliases: ['brown lentils', 'green lentils', 'dry lentils'] },
  'red lentils': { gramsPerCup: 192, type: 'dry', aliases: ['split red lentils'] },
  'french lentils': { gramsPerCup: 192, type: 'dry', aliases: ['puy lentils', 'du puy lentils'] },
  'split peas': { gramsPerCup: 196, type: 'dry', aliases: ['green split peas', 'yellow split peas'] },
  'black-eyed peas': { gramsPerCup: 165, type: 'dry', aliases: ['black eyed peas', 'cowpeas'] },
  'lima beans': { gramsPerCup: 156, type: 'dry', aliases: ['butter beans'] },
  'fava beans': { gramsPerCup: 170, type: 'dry', aliases: ['broad beans'] },
  'edamame': { gramsPerCup: 155, type: 'wet', aliases: ['shelled edamame'] },
  'hummus': { gramsPerCup: 246, type: 'wet' },
  'refried beans': { gramsPerCup: 252, type: 'wet', aliases: ['canned refried beans'] },
  'baked beans': { gramsPerCup: 254, type: 'wet', aliases: ['canned baked beans'] },
  'tofu': { gramsPerCup: 252, type: 'wet', aliases: ['firm tofu', 'silken tofu', 'extra firm tofu'] },
  'tempeh': { gramsPerCup: 166, type: 'dry', aliases: ['crumbled tempeh'] },

  // ==================== CONDIMENTS & SAUCES (22 entries) ====================
  'mayonnaise': { gramsPerCup: 220, type: 'wet', aliases: ['mayo'] },
  'ketchup': { gramsPerCup: 274, type: 'wet', aliases: ['catsup', 'tomato ketchup'] },
  'mustard': { gramsPerCup: 250, type: 'wet', aliases: ['yellow mustard', 'prepared mustard'] },
  'dijon mustard': { gramsPerCup: 250, type: 'wet', aliases: ['dijon'] },
  'whole grain mustard': { gramsPerCup: 250, type: 'wet' },
  'hot sauce': { gramsPerCup: 263, type: 'wet', aliases: ['sriracha', 'tabasco', 'frank\'s'] },
  'bbq sauce': { gramsPerCup: 280, type: 'wet', aliases: ['barbecue sauce'] },
  'teriyaki sauce': { gramsPerCup: 288, type: 'wet' },
  'hoisin sauce': { gramsPerCup: 280, type: 'wet' },
  'oyster sauce': { gramsPerCup: 290, type: 'wet' },
  'salsa': { gramsPerCup: 240, type: 'wet', aliases: ['tomato salsa', 'picante sauce'] },
  'pesto': { gramsPerCup: 234, type: 'wet', aliases: ['basil pesto'] },
  'marinara sauce': { gramsPerCup: 250, type: 'wet', aliases: ['pasta sauce', 'tomato sauce', 'red sauce'] },
  'alfredo sauce': { gramsPerCup: 260, type: 'wet' },
  'enchilada sauce': { gramsPerCup: 240, type: 'wet' },
  'tomato paste': { gramsPerCup: 262, type: 'wet' },
  'tomato sauce': { gramsPerCup: 245, type: 'wet', aliases: ['canned tomato sauce'] },
  'crushed tomatoes': { gramsPerCup: 245, type: 'wet', aliases: ['canned crushed tomatoes'] },
  'diced canned tomatoes': { gramsPerCup: 240, type: 'wet', aliases: ['canned diced tomatoes'] },
  'coconut aminos': { gramsPerCup: 255, type: 'wet' },
  'miso paste': { gramsPerCup: 275, type: 'wet', aliases: ['miso', 'white miso', 'red miso'] },
  'gochujang': { gramsPerCup: 300, type: 'wet', aliases: ['korean chili paste'] },

  // ==================== MEAT & PROTEIN (14 entries) ====================
  'ground beef': { gramsPerCup: 226, type: 'wet', aliases: ['minced beef', 'hamburger meat'] },
  'ground turkey': { gramsPerCup: 220, type: 'wet', aliases: ['minced turkey', 'ground turkey meat'] },
  'ground chicken': { gramsPerCup: 220, type: 'wet', aliases: ['minced chicken'] },
  'ground pork': { gramsPerCup: 226, type: 'wet', aliases: ['minced pork', 'pork mince'] },
  'ground lamb': { gramsPerCup: 226, type: 'wet', aliases: ['minced lamb'] },
  'shredded chicken': { gramsPerCup: 140, type: 'dry', aliases: ['pulled chicken'] },
  'shredded pork': { gramsPerCup: 140, type: 'dry', aliases: ['pulled pork'] },
  'shredded beef': { gramsPerCup: 140, type: 'dry', aliases: ['pulled beef'] },
  'diced chicken': { gramsPerCup: 140, type: 'dry', aliases: ['cubed chicken', 'chopped chicken'] },
  'diced ham': { gramsPerCup: 150, type: 'dry', aliases: ['cubed ham'] },
  'bacon bits': { gramsPerCup: 100, type: 'dry', aliases: ['crumbled bacon'] },
  'sausage': { gramsPerCup: 200, type: 'wet', aliases: ['crumbled sausage', 'ground sausage'] },
  'canned tuna': { gramsPerCup: 154, type: 'wet', aliases: ['tuna'] },
  'canned salmon': { gramsPerCup: 154, type: 'wet', aliases: ['salmon'] },
};

/**
 * Build a search index for faster lookups
 */
const searchIndex = new Map<string, string>();

// Populate the search index with all names and aliases
for (const [name, data] of Object.entries(INGREDIENT_DENSITIES)) {
  // Add the canonical name
  searchIndex.set(name.toLowerCase(), name);

  // Add all aliases
  if (data.aliases) {
    for (const alias of data.aliases) {
      searchIndex.set(alias.toLowerCase(), name);
    }
  }
}

/**
 * Find the best matching ingredient in the database
 * Uses fuzzy matching to handle variations in ingredient names
 */
export function findIngredientDensity(ingredientName: string): IngredientDensity | null {
  const normalized = ingredientName.toLowerCase().trim();

  // 1. Direct match
  const directMatch = searchIndex.get(normalized);
  if (directMatch) {
    return INGREDIENT_DENSITIES[directMatch];
  }

  // 2. Try partial matches - check if any key is contained in the ingredient name
  for (const [key, canonicalName] of searchIndex.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return INGREDIENT_DENSITIES[canonicalName];
    }
  }

  // 3. Try word-based matching - check if key words match
  const words = normalized.split(/[\s,]+/).filter(w => w.length > 2);
  for (const [key, canonicalName] of searchIndex.entries()) {
    const keyWords = key.split(/[\s,]+/);
    const matchCount = words.filter(w => keyWords.some(kw => kw.includes(w) || w.includes(kw))).length;
    if (matchCount >= Math.min(2, words.length)) {
      return INGREDIENT_DENSITIES[canonicalName];
    }
  }

  // 4. Check for common category patterns
  if (normalized.includes('flour')) {
    return INGREDIENT_DENSITIES['all-purpose flour'];
  }
  if (normalized.includes('sugar') && !normalized.includes('brown')) {
    return INGREDIENT_DENSITIES['granulated sugar'];
  }
  if (normalized.includes('oil')) {
    return INGREDIENT_DENSITIES['vegetable oil'];
  }
  if (normalized.includes('milk') && !normalized.includes('coconut')) {
    return INGREDIENT_DENSITIES['milk'];
  }
  if (normalized.includes('cream') && !normalized.includes('ice')) {
    return INGREDIENT_DENSITIES['heavy cream'];
  }
  if (normalized.includes('butter') && !normalized.includes('peanut') && !normalized.includes('almond')) {
    return INGREDIENT_DENSITIES['butter'];
  }
  if (normalized.includes('cheese')) {
    return INGREDIENT_DENSITIES['shredded cheese'];
  }

  return null;
}

// Track ingredients that need AI lookup (for batch fetching)
const unknownIngredients = new Set<string>();
let prefetchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Register an unknown ingredient for AI lookup
 * Batches requests to avoid too many API calls
 */
function registerUnknownIngredient(ingredientName: string): void {
  unknownIngredients.add(ingredientName.toLowerCase().trim());

  // Debounce prefetch to batch multiple ingredients
  if (prefetchTimeout) {
    clearTimeout(prefetchTimeout);
  }

  prefetchTimeout = setTimeout(async () => {
    const ingredients = Array.from(unknownIngredients);
    unknownIngredients.clear();

    if (ingredients.length > 0) {
      // Dynamically import to avoid circular dependencies
      const { prefetchIngredientDensities } = await import('../services/ingredientDensity.service');
      prefetchIngredientDensities(ingredients).catch(console.warn);
    }
  }, 500);
}

/**
 * Get density from AI cache (synchronous)
 * Returns null if not cached
 */
function getAICachedDensity(ingredientName: string): IngredientDensity | null {
  try {
    // Check localStorage cache directly to avoid async imports during render
    const cacheKey = 'gramgrab_ingredient_densities';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cache = JSON.parse(cached);
      const entry = cache[ingredientName.toLowerCase().trim()];
      if (entry && entry.gramsPerCup && entry.type) {
        // Check expiry (30 days)
        const expiryMs = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - entry.fetchedAt < expiryMs) {
          return { gramsPerCup: entry.gramsPerCup, type: entry.type };
        }
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

/**
 * Check if an ingredient should be converted by weight (grams) or volume (ml)
 */
export function shouldConvertToWeight(ingredientName: string): boolean {
  // First check local database
  let density = findIngredientDensity(ingredientName);

  // Then check AI cache
  if (!density) {
    density = getAICachedDensity(ingredientName);
  }

  if (!density) {
    // Register for AI lookup in background
    registerUnknownIngredient(ingredientName);

    // Default: if unknown, convert wet-sounding things to ml, dry to grams
    const normalized = ingredientName.toLowerCase();
    const wetKeywords = ['juice', 'milk', 'cream', 'water', 'broth', 'stock', 'sauce', 'oil', 'syrup', 'wine', 'beer', 'coffee', 'tea'];
    return !wetKeywords.some(keyword => normalized.includes(keyword));
  }

  // Wet ingredients stay as volume (ml)
  // Dry, powder, and fat ingredients convert to weight (grams)
  return density.type !== 'wet';
}

/**
 * Convert cups to grams for a specific ingredient
 * Returns null if ingredient is not in database or AI cache
 */
export function cupsToGrams(cups: number, ingredientName: string): number | null {
  // First check local database
  let density = findIngredientDensity(ingredientName);

  // Then check AI cache
  if (!density) {
    density = getAICachedDensity(ingredientName);
  }

  if (!density) {
    // Register for AI lookup in background
    registerUnknownIngredient(ingredientName);
    return null;
  }

  return cups * density.gramsPerCup;
}

/**
 * Convert grams to cups for a specific ingredient
 * Returns null if ingredient is not in database or AI cache
 */
export function gramsToCups(grams: number, ingredientName: string): number | null {
  // First check local database
  let density = findIngredientDensity(ingredientName);

  // Then check AI cache
  if (!density) {
    density = getAICachedDensity(ingredientName);
  }

  if (!density) {
    // Register for AI lookup in background
    registerUnknownIngredient(ingredientName);
    return null;
  }

  return grams / density.gramsPerCup;
}

/**
 * Find ingredient density with AI fallback support
 * Checks local database first, then AI cache
 */
export function findIngredientDensityWithAI(ingredientName: string): IngredientDensity | null {
  // First check local database
  const localDensity = findIngredientDensity(ingredientName);
  if (localDensity) {
    return localDensity;
  }

  // Then check AI cache
  const aiDensity = getAICachedDensity(ingredientName);
  if (aiDensity) {
    return aiDensity;
  }

  // Register for background fetch
  registerUnknownIngredient(ingredientName);
  return null;
}
