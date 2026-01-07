# GramGrab - Future Phases & Feature Ideas

This document outlines potential features for future development phases.

---

## Phase: AI-Powered Features

### 1. "Fusion Kitchen" (The Remix Engine)

**Concept:** Take two different recipes (e.g., "Spicy Tacos" and "Mac & Cheese") and ask the AI to merge them into a single valid recipe entity ("Taco Mac").

**Why:** Leverages existing AI architecture to create truly unique content that doesn't exist elsewhere. High "viral" potential if users share their crazy creations.

**Implementation:**
- UI to select 2 Recipe IDs
- Prompt AI: "Create a cohesive dish combining the flavor profile of A with the technique of B."
- Save as a new Recipe (automatically forked from both parents - dual parentage)

**Technical Considerations:**
- New endpoint: `POST /ai/fusion` accepting two recipe IDs
- AI prompt engineering for coherent fusion results
- Database: May need to support multiple parent references or a "fusion" relation
- UI: Recipe picker modal, preview of fusion result before saving

---

### 2. "Dietary Shield" (Safety Layer)

**Concept:** Active protection based on user profile. If a user marked "Peanut Allergy" views a recipe with peanut butter, the UI flashes a warning.

**The "Magic" Part:** The AI instantly offers a "Safe Mode" toggle. If clicked, it rewrites the ingredient list and steps in-memory to replace the allergen (e.g., "Substitute Almond Butter" or "Sunflower Butter") without permanently changing the recipe.

**Why:** Builds massive trust with users who have dietary restrictions. Critical for accessibility.

**Implementation:**

1. **User Profile Extension:**
   - Add dietary restrictions/allergies to user profile
   - Common options: Peanuts, Tree Nuts, Dairy, Gluten, Shellfish, Eggs, Soy, etc.
   - Custom allergen input

2. **Recipe Scanning:**
   - AI-powered ingredient scanning against user's allergen list
   - Real-time warnings on recipe view

3. **Safe Mode Toggle:**
   - AI generates safe substitutions on-the-fly
   - Display modified recipe in-memory (not saved)
   - Option to fork recipe with substitutions applied

**Technical Considerations:**
- New endpoint: `POST /ai/safe-substitute/:recipeId`
- User profile schema extension for allergies
- Frontend: Warning banner component, "Safe Mode" toggle UI
- Allergen database/mapping for common ingredients

---

## Phase: Export & Sharing

### 3. "Heirloom Cookbook" Generator

**Concept:** Select a Collection (e.g., "Grandma's Favorites") and generate a high-quality, printable PDF cookbook.

**Features:**
- Auto-generate Table of Contents
- Layout logic: Photo on left, text on right
- "Dedication" page with custom message
- Cover page with collection name
- Recipe pages with consistent styling
- Optional: Family photos, story sections

**Why:** Turns digital data into a physical gift. Perfect for holidays, weddings, family reunions.

**Technical Options:**

1. **Frontend (react-pdf):**
   - Generate PDF entirely in browser
   - No server load
   - Limited styling options

2. **Backend (Puppeteer):**
   - Render print-optimized HTML to PDF
   - Full CSS control
   - Better quality, more design flexibility
   - Server resource intensive

3. **Hybrid:**
   - Frontend generates preview
   - Backend generates final high-quality PDF

**Implementation:**
- New endpoint: `GET /groups/:id/export/pdf`
- PDF template components
- Cover page designer (optional)
- Progress indicator for generation

---

## Phase: Social & Collaboration

### 4. "Party Mode" (Collaborative Events)

**Concept:** A temporary shared workspace for a specific event (e.g., "Friendsgiving", "BBQ Night", "Potluck").

**Workflow:**
1. **Create Event** -> Set date, name, description
2. **Invite Friends** -> Email/link invitations
3. **Event Board** -> Friends pin recipes they'll bring
4. **Master Shopping List** -> Aggregates ingredients from all recipes
5. **Delegation** -> Assign "Who brings what" (User A brings Wine, User B cooks Turkey)

**Why:** Moves the app from "Personal Tool" to "Social Platform." Creates engagement and invites new users organically.

**Features:**
- Event dashboard with countdown
- Recipe pinboard (drag & drop)
- Combined shopping list with assignments
- RSVP tracking
- Chat/comments per recipe
- Post-event: Photo gallery, "Best Dish" voting

**Technical Considerations:**

**Database Schema:**
```prisma
model Event {
  id          String   @id @default(uuid())
  name        String
  description String?
  date        DateTime
  createdBy   String

  participants EventParticipant[]
  recipes      EventRecipe[]
  shoppingItems EventShoppingItem[]
}

model EventParticipant {
  id       String @id @default(uuid())
  eventId  String
  userId   String?
  email    String?
  role     EventRole @default(GUEST)
  status   RSVPStatus @default(PENDING)
}

model EventRecipe {
  id         String @id @default(uuid())
  eventId    String
  recipeId   String
  assignedTo String?
  notes      String?
}

model EventShoppingItem {
  id         String @id @default(uuid())
  eventId    String
  ingredient String
  quantity   String?
  assignedTo String?
  purchased  Boolean @default(false)
}
```

**API Endpoints:**
- `POST /events` - Create event
- `POST /events/:id/invite` - Send invitations
- `POST /events/:id/recipes` - Pin recipe to event
- `GET /events/:id/shopping-list` - Aggregated shopping list
- `PATCH /events/:id/assign` - Delegate tasks

---

### 13. "The Cookie Beacon" (Hyper-Local FOMO)

**Concept:** Solves the problem of "I baked 24 cupcakes but live alone."

**The Problem:** Home bakers often make more than they can eat. Food goes stale or gets wasted. Meanwhile, friends nearby would love fresh-baked goods but don't know they exist.

**The Feature:** A push notification system for close friends/family only (geofenced to ~1 mile radius).

**Workflow:**
1. User finishes baking something
2. Hit the **"Activate Beacon"** button
3. Select the recipe they just made
4. Set availability: "First 6 people" or "Next 30 minutes"
5. **The Result:** Friends get a ping:

```
🚨 HOT COOKIES at Sarah's house!
   Chocolate Chip (12 available)
   5 minutes ago • 0.3 miles away
   [Claim Yours] [Pass]
```

**Why:** Gamifies sharing food. Turns solitary baking into spontaneous social gatherings. Creates "FOMO" that drives engagement.

**Features:**
- **Beacon activation** - One-tap "I just made this!" button
- **Friend circles** - "Close Friends" vs "All Friends" radius
- **Claim system** - Reserve your portion before heading over
- **Expiry timer** - Beacon auto-deactivates (freshness matters!)
- **History** - "Sarah's shared 47 batches this year" stats
- **Gratitude** - Thank-you reactions and photos

**Beacon States:**
| State | Display |
|-------|---------|
| 🟢 HOT | Just out of oven (< 15 min) |
| 🟡 WARM | Still fresh (15-60 min) |
| 🟠 COOLING | Grab soon (1-3 hours) |
| ⚫ EXPIRED | No longer available |

**Technical Considerations:**

**Database Schema:**
```prisma
model Beacon {
  id          String   @id @default(uuid())
  userId      String
  recipeId    String
  location    Json     // { lat, lng }
  quantity    Int      // How many portions
  claimed     Int      @default(0)
  message     String?  // "Ring doorbell!"
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  claims      BeaconClaim[]
}

model BeaconClaim {
  id        String   @id @default(uuid())
  beaconId  String
  userId    String
  claimedAt DateTime @default(now())
  pickedUp  Boolean  @default(false)

  beacon    Beacon   @relation(fields: [beaconId], references: [id])
}

model FriendCircle {
  id       String @id @default(uuid())
  userId   String
  friendId String
  tier     FriendTier @default(REGULAR) // CLOSE, REGULAR
}
```

**API Endpoints:**
- `POST /beacons` - Activate a beacon
- `GET /beacons/nearby` - Get active beacons within radius
- `POST /beacons/:id/claim` - Claim a portion
- `PATCH /beacons/:id/pickup` - Mark as picked up
- `DELETE /beacons/:id` - Deactivate beacon early

**Push Notification:**
```typescript
{
  title: "🚨 HOT COOKIES nearby!",
  body: "Sarah just baked Chocolate Chip cookies • 0.3mi away",
  data: {
    type: "beacon",
    beaconId: "...",
    recipeId: "...",
    distance: 0.3
  }
}
```

**Privacy Considerations:**
- Location only shared with approved friends
- Exact address only shown after claiming
- User controls who can see beacons (friend tiers)
- Can disable beacon notifications anytime

**Enhancement: "Wish Board" (Community Requests)**

Instead of trading ingredients (legal risk), add a passive "wish" system:

```
🍪 COOKIE BEACON

[I'm sharing something!] ← existing beacon flow

[I could use something!] ← NEW: post a wish
   "Could really use some lemons if anyone has extra!"
```

**How Wishes Work:**
1. User posts a wish (ingredient they need)
2. Wish appears on friends' beacon feeds
3. **No obligation, no exchange required**
4. If someone has extra, they can beacon it
5. Gift economy, not barter economy

**Wish Examples:**
```
💭 COMMUNITY WISHES (nearby)

• "Anyone have spare eggs? Making brownies!"
   - Sarah, 0.2mi, 10 min ago

• "Looking for fresh basil - will trade good karma 😊"
   - Mike, 0.5mi, 1 hour ago

• "Need 1 cup of flour, ran out mid-recipe!"
   - Alex, 0.1mi, 5 min ago
```

**Why This Is Legally Safe:**
- No explicit quid pro quo
- Framed as community bulletin board
- Gifting, not trading
- App doesn't facilitate exchange, just posts requests

**Additional Schema:**
```prisma
model Wish {
  id          String   @id @default(uuid())
  userId      String
  ingredient  String
  note        String?
  fulfilled   Boolean  @default(false)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}
```

**Additional Endpoints:**
- `POST /wishes` - Post a wish
- `GET /wishes/nearby` - Get community wishes
- `PATCH /wishes/:id/fulfill` - Mark as fulfilled

---

### 14. "Ghost Kitchen" (Home Restaurant Simulator)

**Concept:** Run a virtual "restaurant" from your home kitchen. Set a weekly menu, friends "order" dishes, you cook and deliver/pickup.

**The Vision:** Transform passionate home cooks into neighborhood culinary stars with a gamified restaurant experience.

**Workflow:**
1. **Create your "restaurant"** - Name, logo, cuisine style, operating hours
2. **Set weekly menu** - Using Bistro Builder's fancy descriptions
3. **Friends browse & "order"** - Reserve dishes for pickup
4. **You cook & fulfill** - Cookie Beacon-style pickup notifications
5. **They rate the experience** - Affects your "Michelin stars"

**Restaurant Dashboard:**
```
┌─────────────────────────────────────────────┐
│ 🍳 SARAH'S SOUL KITCHEN                     │
│ ⭐⭐⭐ Three Star Kitchen                    │
├─────────────────────────────────────────────┤
│ This Week's Menu:                           │
│ • Grandma's Fried Chicken    $0 (tips ok)   │
│ • Mac & Cheese Deluxe        $0 (tips ok)   │
│ • Peach Cobbler              $0 (tips ok)   │
├─────────────────────────────────────────────┤
│ 📊 STATS                                    │
│ Orders fulfilled: 127                       │
│ Repeat customers: 23                        │
│ Average rating: 4.8/5                       │
│ Tips received: $342                         │
└─────────────────────────────────────────────┘
```

**Gamification:**
| Milestone | Reward |
|-----------|--------|
| 10 orders fulfilled | ⭐ One Star Kitchen |
| 50 orders + 4.5 avg rating | ⭐⭐ Two Star Kitchen |
| 100 orders + 4.8 rating | ⭐⭐⭐ Three Star Kitchen |
| 10 "regulars" (5+ orders each) | "Neighborhood Legend" badge |
| First tip received | "Tips Appreciated" badge |

**Features:**
- **Menu builder** - Drag recipes into weekly slots
- **Order management** - See incoming orders, confirm/decline
- **Pickup scheduling** - Integration with Cookie Beacon
- **Review system** - Customers rate and leave comments
- **Tip jar** - Optional tipping (keeps it legal as gifts)
- **Analytics** - Popular dishes, peak times, repeat customers

**Legal Considerations:**
- Frame as "home cooking shared with friends" not "food business"
- No mandatory payments (tips only, always optional)
- Limit to friend network (not public marketplace)
- Include disclaimer about home kitchen status

**Database Schema:**
```prisma
model GhostKitchen {
  id            String   @id @default(uuid())
  userId        String   @unique
  name          String
  description   String?
  cuisineStyle  String?
  logoUrl       String?
  stars         Int      @default(0)
  totalOrders   Int      @default(0)
  totalTips     Decimal  @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  menuItems     GhostKitchenMenuItem[]
  orders        GhostKitchenOrder[]
}

model GhostKitchenMenuItem {
  id            String   @id @default(uuid())
  kitchenId     String
  recipeId      String
  available     Boolean  @default(true)
  maxOrders     Int?     // null = unlimited
  dayOfWeek     Int?     // 0-6, null = all week

  kitchen       GhostKitchen @relation(fields: [kitchenId], references: [id])
}

model GhostKitchenOrder {
  id            String   @id @default(uuid())
  kitchenId     String
  customerId    String
  menuItemId    String
  status        OrderStatus @default(PENDING)
  pickupTime    DateTime?
  rating        Int?
  review        String?
  tipAmount     Decimal?
  createdAt     DateTime @default(now())

  kitchen       GhostKitchen @relation(fields: [kitchenId], references: [id])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  COOKING
  READY
  PICKED_UP
  CANCELLED
}
```

**API Endpoints:**
- `POST /ghost-kitchen` - Create your kitchen
- `PATCH /ghost-kitchen` - Update kitchen details
- `POST /ghost-kitchen/menu` - Add menu item
- `GET /ghost-kitchen/:id/menu` - View kitchen menu
- `POST /ghost-kitchen/:id/order` - Place an order
- `PATCH /ghost-kitchen/orders/:id` - Update order status
- `POST /ghost-kitchen/orders/:id/review` - Leave review

**Why it works:** People already do this informally ("I'll make you dinner sometime"). This formalizes and gamifies it. Creates a real micro-economy within the app.

---

---

## Phase: Personalization & Intelligence

### 15. "Flavor DNA" (Personal Taste Genome)

**Concept:** The app learns your unique taste profile over time and powers *every* other feature with personalization.

**The Vision:** Netflix knows what shows you'll like. Spotify knows your music taste. GramGrab should know your flavor preferences.

**How Flavor DNA Builds:**

1. **Passive Learning:**
   - Recipes you save → signals interest
   - Recipes you cook → stronger signal
   - Recipes you rate highly → strongest signal
   - Recipes you skip → negative signal

2. **Ingredient Analysis:**
   - Tracks which ingredients appear in your favorites
   - Notes what you substitute out (hates cilantro)
   - Learns your spice tolerance from patterns

3. **Behavioral Patterns:**
   - Prefers 30-min meals (time)
   - Cooks more on weekends (schedule)
   - Italian and Thai most common (cuisines)

4. **Micro-Feedback:**
   - Occasional "Was this too spicy?" prompts
   - Post-cook quick ratings
   - "Would you make this again?"

**Your Flavor DNA Profile:**
```
┌────────────────────────────────────────┐
│ 🧬 YOUR FLAVOR DNA                     │
├────────────────────────────────────────┤
│                                        │
│ TASTE PROFILE                          │
│ 🔥 Heat Tolerance:    ████████░░ 8/10  │
│ 🧂 Salt Preference:   ██████░░░░ 6/10  │
│ 🍬 Sweet Tooth:       ███░░░░░░░ 3/10  │
│ 🫒 Fat Comfort:       ███████░░░ 7/10  │
│ 🍋 Acid Love:         █████████░ 9/10  │
│ 🌿 Herbaceous:        █████████░ 9/10  │
│ 🍄 Umami Craving:     ████████░░ 8/10  │
│                                        │
├────────────────────────────────────────┤
│ ❤️ FLAVOR AFFINITIES                   │
│ Garlic • Lemon • Parmesan • Chili      │
│ Fresh Herbs • Soy Sauce • Lime         │
│                                        │
│ 🚫 FLAVOR AVERSIONS                    │
│ Cilantro • Blue Cheese • Licorice      │
│                                        │
├────────────────────────────────────────┤
│ 🌍 CUISINE PREFERENCES                 │
│ 1. Italian      ████████░░ 42 recipes  │
│ 2. Thai         ███████░░░ 31 recipes  │
│ 3. Mexican      ██████░░░░ 28 recipes  │
│ 4. Japanese     █████░░░░░ 19 recipes  │
│                                        │
├────────────────────────────────────────┤
│ ⏱️ COOKING STYLE                       │
│ Avg cook time: 35 min                  │
│ Peak cooking: Weekends                 │
│ Complexity: Intermediate               │
└────────────────────────────────────────┘
```

**How Flavor DNA Supercharges Other Features:**

| Feature | Without DNA | With DNA |
|---------|-------------|----------|
| **Recipe Discovery** | Generic "popular" | "You'll love this" |
| **Mystery Box** | Random challenge | Challenge matching your taste |
| **Fusion Kitchen** | Generic fusion | Fusion tuned to your profile |
| **Stock Market** | All ingredient prices | YOUR ingredients on sale |
| **Dietary Shield** | Just allergen warnings | Safe swaps you'd actually like |
| **Copycat Cam** | Generic recreation | "Adjusted to your spice level" |

**AI Integration:**
```typescript
// Every AI prompt gets enriched with Flavor DNA
const enrichedPrompt = `
  User's Flavor DNA:
  - Heat tolerance: 8/10 (loves spicy)
  - Dislikes: cilantro, blue cheese
  - Favorite cuisines: Italian, Thai
  - Preferred cook time: under 40 min

  With this in mind, ${originalPrompt}
`;
```

**"Flavor Match" Score:**
Every recipe shows compatibility:
```
🍝 Spicy Vodka Rigatoni
⭐⭐⭐⭐⭐ 4.8 (1.2k reviews)
🧬 96% Flavor Match
   ✓ Italian cuisine (your #1)
   ✓ Spicy (you love heat)
   ✓ 25 min (fits your schedule)
   ✓ Contains garlic, parmesan (your favorites)
```

**Database Schema:**
```prisma
model FlavorDNA {
  id                String   @id @default(uuid())
  userId            String   @unique

  // Taste preferences (0-10 scale)
  heatTolerance     Float    @default(5)
  saltPreference    Float    @default(5)
  sweetTooth        Float    @default(5)
  fatComfort        Float    @default(5)
  acidLove          Float    @default(5)
  herbaceous        Float    @default(5)
  umamiCraving      Float    @default(5)

  // Computed arrays
  flavorAffinities  String[] // ingredients they love
  flavorAversions   String[] // ingredients they avoid
  cuisineScores     Json     // { "italian": 42, "thai": 31 }

  // Cooking behavior
  avgCookTime       Int?
  preferredDays     Int[]    // 0-6 for days
  complexityLevel   String?  // beginner, intermediate, advanced

  updatedAt         DateTime @updatedAt
}

model FlavorSignal {
  id          String   @id @default(uuid())
  userId      String
  recipeId    String
  signalType  SignalType
  value       Float?   // rating value if applicable
  createdAt   DateTime @default(now())
}

enum SignalType {
  VIEWED
  SAVED
  COOKED
  RATED
  SKIPPED
  SUBSTITUTED
}
```

**API Endpoints:**
- `GET /flavor-dna` - Get user's Flavor DNA profile
- `GET /flavor-dna/match/:recipeId` - Get match score for recipe
- `POST /flavor-dna/signal` - Record a flavor signal
- `POST /flavor-dna/feedback` - Submit micro-feedback
- `GET /recipes/recommended` - DNA-powered recommendations

**Privacy:**
- Flavor DNA is private by default
- Optional: Share DNA to find "taste twins"
- Can reset/delete DNA anytime

---

## Phase: Utility & Daily Use

### 16. "Pantry Whisperer" (Smart Inventory + Waste Prevention)

**Concept:** Track what's actually in your kitchen. AI prevents waste and suggests what to cook.

**The Problem:**
- "What's for dinner?" paralysis happens daily
- Food expires and gets thrown away
- Shopping without knowing what you have → duplicates
- Recipe browsing without knowing what's available → frustration

**The Solution:** A smart pantry that knows what you have and helps you use it.

**Core Features:**

**1. Pantry Tracking:**
```
┌─────────────────────────────────────────┐
│ 🏪 YOUR PANTRY                          │
├─────────────────────────────────────────┤
│ 🥬 PRODUCE            ⚠️ 3 expiring     │
│ • Spinach        expires in 2 days  ⚠️  │
│ • Bell peppers   expires in 5 days      │
│ • Onions         good for 2 weeks       │
│ • Garlic         good for 3 weeks       │
│                                         │
│ 🥛 DAIRY              ⚠️ 1 expiring     │
│ • Heavy cream    expires tomorrow!  🔴  │
│ • Parmesan       expires in 2 weeks     │
│ • Butter         expires in 3 weeks     │
│                                         │
│ 🥫 PANTRY STAPLES                       │
│ • Pasta (3 boxes)                       │
│ • Rice (half bag)                       │
│ • Olive oil (plenty)                    │
│ • Canned tomatoes (2 cans)              │
└─────────────────────────────────────────┘
```

**2. Expiry Alerts:**
```
⚠️ USE IT OR LOSE IT

These items expire soon:
• Heavy cream (tomorrow!)
• Spinach (2 days)
• 3 bananas (getting spotty)

🍳 RESCUE RECIPES:
• Creamy Tuscan Chicken (uses cream + spinach)
• Banana Bread (uses all 3 bananas)
• Spinach & Cream Pasta (quick 20 min)

[Cook Now] [Remind Me Tonight] [Beacon It]
```

**3. Recipe Compatibility:**
When viewing any recipe:
```
🍝 Creamy Garlic Tuscan Shrimp

INGREDIENT CHECK:
✅ Garlic (you have this)
✅ Heavy cream (you have this - use soon!)
✅ Spinach (you have this - use soon!)
✅ Parmesan (you have this)
🛒 Shrimp (add to list)
🛒 Sun-dried tomatoes (add to list)

4 of 6 ingredients in pantry!
[Add Missing to Shopping List]
```

**4. "What's For Dinner?" Button:**
One tap → AI magic:
```
🤔 WHAT CAN I MAKE?

Based on your pantry, here are tonight's options:

⭐ BEST MATCH (uses expiring items)
   Creamy Spinach Pasta
   Uses: cream, spinach, garlic, parmesan
   Time: 20 min | 🧬 94% Flavor Match

🥈 RUNNER UP
   Garlic Butter Rice Bowl
   Uses: rice, butter, garlic
   Time: 25 min | 🧬 87% Flavor Match

🥉 ALSO POSSIBLE
   Simple Tomato Pasta
   Uses: pasta, canned tomatoes, garlic
   Time: 15 min | 🧬 82% Flavor Match

[See All Options] [Surprise Me]
```

**5. Smart Shopping Integration:**
```
When you add a recipe to "Cook This Week":

📝 SMART SHOPPING LIST

NEED TO BUY:
• Shrimp, 1 lb (for Tuscan Shrimp)
• Sun-dried tomatoes (for Tuscan Shrimp)
• Chicken thighs, 2 lbs (for Thai Basil Chicken)

ALREADY HAVE:
• Garlic ✓
• Heavy cream ✓
• Spinach ✓
• Basil ✓

RUNNING LOW (consider adding):
• Olive oil (1/4 bottle left)
• Rice (half bag)
```

**Pantry Entry Methods:**

1. **Manual Entry** - Search and add items
2. **Receipt Scanning** - OCR grocery receipts
3. **Shopping List Sync** - Auto-add when you check off items
4. **Voice Entry** - "Add 2 lbs chicken breast"
5. **Barcode Scanning** - Scan product barcodes

**Integration with Other Features:**

| Feature | Pantry Integration |
|---------|-------------------|
| **Mystery Box** | "Generate challenge from my pantry" |
| **Stock Market** | "Alert when pantry items are on sale" |
| **Cookie Beacon** | "Beacon expiring items before waste" |
| **Wish Board** | Auto-suggest wishes for missing ingredients |
| **Flavor DNA** | Prioritize recipes matching both pantry AND taste |

**Database Schema:**
```prisma
model PantryItem {
  id            String    @id @default(uuid())
  userId        String
  ingredientId  String?   // link to ingredient database
  name          String
  quantity      String?
  unit          String?
  category      PantryCategory
  expiresAt     DateTime?
  purchasedAt   DateTime?
  isStaple      Boolean   @default(false) // always in stock
  lowThreshold  String?   // "half bag", "1 bottle"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
}

enum PantryCategory {
  PRODUCE
  DAIRY
  MEAT
  SEAFOOD
  PANTRY
  FROZEN
  SPICES
  CONDIMENTS
  BEVERAGES
  OTHER
}

model PantryAlert {
  id          String   @id @default(uuid())
  userId      String
  itemId      String
  alertType   AlertType
  dismissed   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

enum AlertType {
  EXPIRING_SOON
  EXPIRED
  RUNNING_LOW
  OUT_OF_STOCK
}
```

**API Endpoints:**
- `GET /pantry` - Get all pantry items
- `POST /pantry` - Add item to pantry
- `PATCH /pantry/:id` - Update item (quantity, expiry)
- `DELETE /pantry/:id` - Remove item
- `GET /pantry/alerts` - Get expiry/low stock alerts
- `GET /pantry/suggestions` - AI recipe suggestions from pantry
- `POST /pantry/scan-receipt` - OCR receipt processing
- `GET /recipes/:id/pantry-check` - Check recipe against pantry

**Smart Defaults:**
- Common staples auto-marked as "always have" (salt, pepper, oil)
- AI learns your typical stock levels
- Seasonal adjustments (you buy more produce in summer)

---

## Phase: Gamification & Entertainment

### 5. "Roast My Plate" (AI Food Critic)

**Concept:** Users snap a photo of their finished dish, and the AI rates the presentation with entertaining personality.

**The Entertaining Part:** Select a "Persona" for the critique:

| Persona | Style | Example |
|---------|-------|---------|
| **The Gordon** | Brutal honesty | "THE SCALLOPS ARE RAW! But the garnish is nice. 2/10." |
| **The Grandma** | Unconditional love | "Oh honey, that looks lovely, maybe a little more sauce next time? 10/10 for effort!" |
| **The Hipster** | Pretentious foodie | "The deconstruction is derivative, but the rustic plate is cool." |
| **The French Chef** | Classical critique | "Ze plating lacks finesse, but ze colors... magnifique!" |
| **The Stoner** | Enthusiastic | "Duuude, that looks AMAZING. Would totally destroy that at 2am." |

**Technical Implementation:**
- GPT-4 Vision API for image analysis
- Analyzes: color balance, plating symmetry, texture, portion size, garnish
- Persona-specific system prompts
- Fun shareable "report card" image generation

**API:**
```
POST /ai/roast-plate
Body: { image: File, persona: 'gordon' | 'grandma' | 'hipster' | ... }
Response: { rating: number, critique: string, highlights: string[], improvements: string[] }
```

**Why:** Pure entertainment value. Highly shareable on social media. Could go viral.

---

### 6. "Culinary RPG" (Skill Tree)

**Concept:** Gamify the cooking process. Turn the user into a Level 10 Chef with unlockable skills and badges.

**How it works:** The AI scans recipe steps for technique keywords and awards XP accordingly.

**Skill Categories:**
- **Knife Skills** - julienne, chiffonade, brunoise, dice
- **Heat Mastery** - sauté, sear, caramelize, flambé
- **Pastry Arts** - tempering, laminating, blind baking
- **Sauce Craft** - emulsify, reduce, mount
- **Global Techniques** - wok hei, tandoor, tagine

**Progression System:**
| Action | Reward |
|--------|--------|
| Complete recipe with "Julienne" | +50 XP Knife Skills |
| Cook 5 Curry dishes | Badge: "Spice Lord" |
| Master 3 French techniques | Badge: "Le Cordon Bleu" |
| Cook 10 recipes total | Level Up! |
| Failed dish (1-star rating) | +20 "Resilience" points |

**Badges to Unlock:**
- "Pastry Wizard" - 5 baking recipes
- "Grill Master" - 10 grilled dishes
- "Sauce Boss" - Master 5 mother sauces
- "World Traveler" - Cook from 10 different cuisines
- "Iron Chef" - Complete 50 recipes

**Database Schema:**
```prisma
model UserSkills {
  id              String @id @default(uuid())
  userId          String @unique
  knifeSkillsXP   Int @default(0)
  heatMasteryXP   Int @default(0)
  pastryArtsXP    Int @default(0)
  sauceCraftXP    Int @default(0)
  globalTechXP    Int @default(0)
  totalRecipes    Int @default(0)
  level           Int @default(1)
  resiliencePoints Int @default(0)
}

model UserBadge {
  id        String @id @default(uuid())
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())
}
```

**Why:** Makes cooking addictive. Users will try harder recipes just to unlock achievements. Retention goldmine.

---

### 7. "Mystery Box" Challenge

**Concept:** Solving the "What's for dinner?" paralysis with a game show format.

**Workflow:**
1. User inputs 3 random ingredients they want to use up (e.g., "Old Bananas," "Sriracha," "Oats")
2. **The Challenge:** AI generates a viable recipe using only those items + pantry staples
3. User cooks the dish and rates the result
4. **Hard Mode:** "Ready, Set, Cook!" - App sets a timer (30/60 min)

**Difficulty Modes:**
| Mode | Rules |
|------|-------|
| **Easy** | 3 ingredients + full pantry |
| **Medium** | 4 ingredients + limited pantry |
| **Hard** | 5 ingredients + timer |
| **Chopped** | Must use ALL ingredients, 30 min timer |

**Features:**
- Ingredient input with autocomplete
- "Pantry Staples" preset (salt, pepper, oil, flour, etc.)
- Timer with notifications
- Challenge history/leaderboard
- Share challenge results

**API:**
```
POST /ai/mystery-box
Body: {
  ingredients: string[],
  difficulty: 'easy' | 'medium' | 'hard' | 'chopped',
  timerMinutes?: number
}
Response: { recipe: ParsedRecipe, challengeId: string }
```

**Why:** Turns food waste management into entertainment. Solves decision paralysis. Creates shareable "I made THIS from THAT?!" moments.

---

## Phase: Geographic & Discovery

### 8. "Flavor Passport" (The Geographic RPG)

**Concept:** A beautiful, interactive 3D globe on the user's dashboard that tracks culinary adventures.

**The Hook:** Every time a user cooks a recipe, the AI detects its origin (e.g., Pad Thai → Thailand).

**Gamification:**
- Country lights up on the globe when you cook its cuisine
- Collect digital "passport stamps" for each region
- Regional badges and achievements
- AI-generated quests to encourage exploration

**Quest Examples:**
- "You've conquered Europe, but your map is empty in South America! Try these 3 Peruvian recipes to unlock the 'Andean Explorer' badge."
- "One more Japanese dish and you'll earn 'Rising Sun Chef'!"
- "Complete the Mediterranean Trilogy: Greek, Italian, Turkish"

**Progression:**
| Region | Recipes Needed | Badge |
|--------|----------------|-------|
| Asia | 5 | "Orient Express" |
| Europe | 5 | "Continental Chef" |
| Americas | 5 | "New World Explorer" |
| Africa | 3 | "Safari Gourmet" |
| Middle East | 3 | "Spice Road Traveler" |
| All Continents | 1 each | "World Chef" |

**Technical:**
- 3D globe: Three.js or react-globe.gl
- Cuisine detection: AI analyzes recipe title/ingredients
- Database: Track user's cooked cuisines and stamps

**Why:** Visually encourages users to break out of their food rut. Creates "collection" mentality.

---

### 9. "Copycat Cam" (Restaurant Spy)

**Concept:** You're at a restaurant and eat something amazing. Snap a photo. The AI reverse-engineers the chef's secret.

**The Magic:** The AI doesn't just identify the food—it attempts to recreate the technique from visual cues.

**Analysis Points:**
- Dish identification
- Cooking method detection (broiled, pan-seared, deep-fried)
- Sauce consistency/glaze analysis
- Plating style and portion estimation
- Likely seasoning profile

**Example Output:**
```
"This looks like a Miso Glazed Black Cod.

Based on the visual analysis:
- The sheen suggests a broiler finish
- Caramelization indicates white miso + mirin base
- Char pattern: ~3 min under high broiler

Here's a recipe modified to match the visual char
and glaze thickness of your photo..."
```

**API:**
```
POST /ai/copycat
Body: { image: File, notes?: string }
Response: {
  dishName: string,
  confidence: number,
  analysis: {
    cookingMethod: string,
    keyIngredients: string[],
    techniques: string[]
  },
  recipe: ParsedRecipe
}
```

**Why:** Bridges "Eating Out" with "Cooking In." Turns the physical world into app content.

---

## Phase: Content Creation & Sharing

### 10. "The Bistro Builder" (Pop-Up Experience)

**Concept:** Hosting a dinner party? Select your courses and generate a professional, stylized Menu Card.

**Workflow:**
1. Select recipes: Appetizer, Main, Dessert (+ optional Wine Pairing)
2. Choose menu style: Classic, Modern, Rustic, Elegant
3. AI generates fancy "Menu Speak" descriptions
4. Export as printable PDF or shareable image

**The AI Twist - Menu Speak Transformation:**

| Your Recipe | Menu Card Version |
|-------------|-------------------|
| Mashed Potatoes | Yukon Gold Silk · Cultured Butter · Chive Infusion |
| Grilled Chicken | Free-Range Poulet · Herb Crust · Jus Naturel |
| Chocolate Cake | Valrhona Fondant · Tahitian Vanilla · Fleur de Sel |
| Caesar Salad | Little Gem Hearts · Aged Parmigiano · Anchovy Essence |

**Menu Styles:**
- **Classic French** - Elegant script, gold accents
- **Modern Minimalist** - Clean sans-serif, lots of whitespace
- **Rustic Farmhouse** - Kraft paper texture, hand-drawn elements
- **Fine Dining** - Black background, centered text

**API:**
```
POST /ai/menu-card
Body: {
  courses: [{ recipeId: string, course: 'appetizer' | 'main' | 'dessert' }],
  style: 'classic' | 'modern' | 'rustic' | 'fine-dining',
  eventName?: string,
  date?: string
}
Response: { pdfUrl: string, imageUrl: string }
```

**Why:** Elevates Tuesday dinner into a "Pop-Up Restaurant" experience. Highly shareable.

---

### 11. "Insta-Chef Mode" (Auto-Vlogger)

**Concept:** Users want to share cooking content but hate editing videos. The app does it for them.

**Workflow:**
1. Start "Insta-Chef Mode" when beginning a recipe
2. App prompts at key moments:
   - "Snap a 3-second video of the onions sizzling!"
   - "Show the cheese pull!"
   - "Capture the final plating!"
3. User records 5-6 short clips during cooking
4. **The Magic:** App auto-stitches clips, syncs to trending audio, adds overlays
5. Export ready-to-post video

**Auto-Generated Elements:**
- Recipe title overlay (branded)
- Ingredient list animation
- Step number transitions
- Background music (royalty-free beats)
- GramGrab watermark
- "Recipe link in bio" call-to-action

**Video Formats:**
- TikTok/Reels (9:16 vertical)
- YouTube Shorts (9:16)
- Instagram Feed (1:1 square)
- Stories (9:16 with swipe-up)

**Technical:**
- FFmpeg for video processing
- Beat detection for clip timing
- Template-based overlay system
- Cloud processing (heavy compute)

**Why:** Turns user base into marketing army. They get cool content; you get watermarked videos everywhere.

---

## Phase: Smart Features

### 12. "Stock Market" (Ingredient Arbitrage)

**Concept:** A cheeky, real-time take on ingredient prices and seasonality.

**The Feature:** Dynamic "ticker" showing ingredient price trends on recipes and dashboard.

**Example Alerts:**
- "📉 BUY NOW: Avocados are 30% cheaper than last month. Make Guacamole!"
- "📈 SELL: Egg prices are up 40%. Maybe skip the Pavlova this week."
- "🌟 IN SEASON: Strawberries at peak! Perfect time for shortcake."
- "⚠️ SHORTAGE: Sriracha supply issues. Stock up or try Gochujang!"

**Features:**
- Price trend indicators on ingredient lists
- "Budget Mode" recipe suggestions based on cheap ingredients
- Seasonal produce calendar
- Weekly "Best Buys" newsletter
- Historical price charts (for food nerds)

**Data Sources:**
- USDA commodity prices API
- Grocery store APIs (Instacart, Kroger)
- Seasonal produce databases
- News scraping for shortage alerts

**Dashboard Widget:**
```
┌─────────────────────────────────┐
│ 🏪 MARKET WATCH                 │
├─────────────────────────────────┤
│ 📉 Chicken Breast  -12% ↓      │
│ 📈 Eggs            +18% ↑      │
│ 📉 Avocados        -30% ↓ HOT! │
│ ── Olive Oil       +2%  →      │
└─────────────────────────────────┘
```

**Why:** Funny, clever conversational piece that actually saves money. Makes app feel "live" and connected to real world.

---

### 17. "Seasonal Sage" (What's Fresh Right Now)

**Concept:** Real-time guidance on what's in season, locally. Bridges Stock Market with recipe discovery.

**The Dashboard Widget:**
```
🌿 WHAT'S FRESH (December - Northeast US)

PEAK SEASON NOW:
🥬 Brussels Sprouts  ████████░░ Peak!
🍊 Citrus            ████████░░ Peak!
🥔 Root Vegetables   ███████░░░ Great
🎃 Winter Squash     ██████░░░░ Good

ENDING SOON:
🍎 Apples           ████░░░░░░ Last call
🍐 Pears            ███░░░░░░░ Wrapping up

COMING NEXT MONTH:
🥦 Broccoli Rabe    February
🍓 Strawberries     March

[Show seasonal recipes] [What's cheap AND fresh?]
```

**Features:**
- Location-aware seasonal data
- "Peak freshness" indicators on ingredients
- Seasonal recipe collections auto-generated
- Farmer's market integration (optional)
- Preservation tips ("Freeze these now for winter!")

**Integration with Other Features:**
| Feature | Seasonal Sage Integration |
|---------|--------------------------|
| **Flavor Passport** | "Cook 5 seasonal recipes for 'Locavore' badge" |
| **Pantry Whisperer** | Highlights seasonal items in your pantry |
| **Stock Market** | Cross-reference: cheap AND in-season |
| **Mystery Box** | "Seasonal ingredients only" challenge mode |
| **Recipe Discovery** | Prioritize seasonal recipes in search |

**API:**
```
GET /seasonal?location=northeast&month=12
Response: {
  peak: ["brussels_sprouts", "citrus", ...],
  good: ["root_vegetables", "squash", ...],
  ending: ["apples", "pears", ...],
  coming: ["broccoli_rabe", "strawberries", ...]
}
```

**Why:** Encourages cooking with what's naturally best. Reduces environmental impact. Often cheaper too.

---

### 18. "Budget Chef Mode" (Cost-Optimized Cooking)

**Concept:** When money is tight, the app helps you eat well for less. AI-powered meal planning within a budget.

**How It Works:**
```
💰 BUDGET CHEF MODE

SETUP:
Weekly grocery budget: $75
Meals to plan: 7 dinners
People: 2 adults
Already have: [Import from Pantry]

[Generate Meal Plan]
```

**AI-Generated Meal Plan:**
```
┌─────────────────────────────────────────┐
│ YOUR BUDGET-OPTIMIZED WEEK              │
├─────────────────────────────────────────┤
│ Mon: Pasta Aglio e Olio      $3.20     │
│ Tue: Black Bean Tacos        $4.50     │
│ Wed: Chicken Stir Fry        $6.80     │
│ Thu: Vegetable Curry         $4.20     │
│ Fri: Sheet Pan Sausage       $7.50     │
│ Sat: Homemade Pizza          $5.40     │
│ Sun: Beef Stew (uses leftovers) $6.20  │
├─────────────────────────────────────────┤
│ TOTAL: $37.80                           │
│ UNDER BUDGET BY: $37.20 🎉              │
└─────────────────────────────────────────┘
```

**Optimization Strategies Used:**
- ✓ Bulk purchases (chicken breast on sale)
- ✓ Protein rotation (beans 3 days = cheap protein)
- ✓ Ingredient overlap (garlic in 5 dishes, buy one bulb)
- ✓ Seasonal produce prioritized
- ✓ Zero-waste planning (stew uses leftover veggies)
- ✓ Store brand recommendations

**Features:**
- Budget slider ($25/week → $200/week)
- Dietary restrictions respected
- Flavor DNA integration (stays tasty for YOU)
- Leftover optimization
- Batch cooking suggestions
- Price comparison across stores

**Quick Challenges:**
```
🎯 BUDGET CHALLENGES

• "$5 Dinner" - Make a full meal for under $5
• "Pantry Raid" - Use ONLY what you have
• "Dollar Store Gourmet" - Fancy dish, cheap ingredients
• "Feed 4 for $10" - Family meal on extreme budget
```

**Integration:**
| Feature | Budget Integration |
|---------|-------------------|
| **Stock Market** | Uses real-time prices |
| **Pantry Whisperer** | Subtracts what you have |
| **Flavor DNA** | Keeps meals tasty for you |
| **Mystery Box** | "Under $5" challenge mode |
| **Seasonal Sage** | Cheap AND in-season |

**API:**
```
POST /ai/budget-plan
Body: {
  budget: 75,
  meals: 7,
  people: 2,
  pantryItems: [...],
  restrictions: ["vegetarian"],
  preferences: { flavorDnaId: "..." }
}
Response: {
  mealPlan: [...],
  totalCost: 37.80,
  shoppingList: [...],
  savings: 37.20,
  optimizations: [...]
}
```

**Why:** Real utility that saves real money. High daily engagement. Positions app as essential, not luxury.

---

## Phase: Voice & Accessibility

### 19. "Sous Chef AI" (Voice-Activated Hands-Free Mode)

**Concept:** When your hands are covered in dough, talk to the app instead. Full voice control for Cook Mode.

**The Problem:** Touching your phone while cooking is:
- Messy (flour, oil, raw chicken)
- Inconvenient (constant hand washing)
- Dangerous (near open flames)

**The Solution:** "Hey GramGrab" voice activation.

**Voice Commands:**

**Navigation:**
```
"Hey GramGrab..."
• "What's the next step?"
• "Read that again"
• "Go back one step"
• "Skip to step 5"
• "Read the ingredients"
• "How much butter do I need?"
```

**Timers:**
```
• "Set a timer for 10 minutes"
• "How much time left?"
• "Add 2 minutes to the timer"
• "Cancel the timer"
• "Remind me to flip in 3 minutes"
```

**Help:**
```
• "What can I substitute for buttermilk?"
• "Is this 350 Fahrenheit or Celsius?"
• "How do I know when it's done?"
• "What does 'fold' mean?"
• "Show me a video of how to julienne"
```

**Notes:**
```
• "Add a note: used less salt"
• "Mark this step as tricky"
• "I'm done cooking" (ends session)
```

**Hands-Free Cook Mode UI:**
```
┌─────────────────────────────────────────┐
│ 🎤 HANDS-FREE MODE                      │
│ "Hey GramGrab" is listening...          │
├─────────────────────────────────────────┤
│                                         │
│           STEP 3 OF 8                   │
│                                         │
│   "Add the garlic and sauté until       │
│    fragrant, about 30 seconds"          │
│                                         │
│         ⏱️ 0:30 remaining               │
│                                         │
├─────────────────────────────────────────┤
│ [🔊 Read Aloud]  [⏭️ Next]  [🎤 Speak] │
└─────────────────────────────────────────┘
```

**Features:**
- Wake word detection ("Hey GramGrab")
- Large, glanceable text
- Voice narration of steps (TTS)
- "Next" triggered by voice OR large tap zone
- Timer overlays that don't obstruct
- Ambient noise handling (kitchen sounds)

**Technical:**
- Web Speech API for recognition
- Text-to-Speech for reading
- Wake word detection (on-device)
- Noise cancellation for kitchen environment

**API:**
```
POST /voice/command
Body: { transcript: "set a timer for 10 minutes", recipeId: "..." }
Response: { action: "SET_TIMER", params: { minutes: 10 }, spoken: "Timer set for 10 minutes" }
```

**Why:** True accessibility feature. Essential for serious home cooks. Differentiator from recipe apps that ignore the actual cooking experience.

---

### 20. "Recipe Rescue" (AI Cooking Recovery)

**Concept:** Something went wrong? Snap a photo or describe the problem, and get AI-powered recovery suggestions.

**The Panic Moment:**
```
😰 SOMETHING WENT WRONG!

What happened?

TEXTURE ISSUES:
[Broken/Curdled] [Too Thick] [Too Thin]
[Lumpy] [Rubbery] [Mushy]

SEASONING:
[Too Salty] [Too Spicy] [Bland] [Bitter]

APPEARANCE:
[Burnt] [Didn't Brown] [Sunk] [Cracked]

TIMING:
[Overcooked] [Undercooked] [Running Late]

[📷 Snap a photo for AI diagnosis]
```

**AI Diagnosis Flow:**

User snaps photo of broken hollandaise:
```
🩺 AI DIAGNOSIS

I see: Broken Hollandaise (emulsion separated)

WHAT HAPPENED:
The butter was added too quickly, or the sauce
got too hot, causing the fats to separate.

HOW TO FIX IT:

1. Start fresh in a NEW bowl with 1 egg yolk
2. Add 1 tsp cold water to the yolk
3. VERY SLOWLY drizzle your broken sauce in
4. Whisk constantly until it comes together
5. Keep heat LOW throughout

⏱️ This should take about 3 minutes

[🎬 Show me a video] [Still broken?] [That worked! 🎉]
```

**Common Rescues:**

| Problem | Quick Fix |
|---------|-----------|
| Over-salted soup | Add potato, acid, or dilute |
| Curdled cream sauce | Strain + blend with fresh cream |
| Burnt garlic | Start over (can't save) |
| Thick sauce | Add liquid gradually |
| Bland dish | Salt, acid, or umami boost |
| Dry chicken | Slice thin, add sauce |
| Sunk cake | Trim flat, make trifle |
| Broken mayo | New yolk, drizzle in broken |

**Features:**
- Photo analysis with GPT-4 Vision
- Quick-fix suggestions
- Video tutorials for techniques
- "Prevention tips" for next time
- Save rescue to recipe notes
- Community "I fixed it!" success stories

**Database:**
```prisma
model RescueLog {
  id          String   @id @default(uuid())
  userId      String
  recipeId    String?
  problem     String
  photoUrl    String?
  diagnosis   String
  solution    String
  wasHelpful  Boolean?
  createdAt   DateTime @default(now())
}
```

**API:**
```
POST /ai/rescue
Body: {
  photo: File,
  problem?: "sauce broke",
  recipeId?: "..."
}
Response: {
  diagnosis: "Broken hollandaise - emulsion separated",
  cause: "Butter added too quickly or sauce overheated",
  solution: [...steps],
  videoUrl?: "...",
  preventionTips: [...]
}
```

**Why:** Builds confidence. Reduces frustration. Creates emotional connection ("GramGrab saved my dinner party!").

---

## Phase: Social Intelligence

### 21. "Kitchen Karma" (Trust & Reputation System)

**Concept:** A unified reputation score that tracks reliability across all social features. The foundation for community trust.

**Your Karma Profile:**
```
┌─────────────────────────────────────────┐
│ ⚖️ KITCHEN KARMA                        │
│ Score: 847 | Level: Trusted Chef        │
├─────────────────────────────────────────┤
│                                         │
│ GIVING KARMA (+)                        │
│ 🍪 Beacon shares:        +340 (34 items)│
│ 🎁 Wishes fulfilled:     +150 (5 times) │
│ 🍳 Ghost Kitchen orders: +200 (10 orders│
│ 🎉 Party Mode dishes:    +100 (5 events)│
│ ⭐ 5-star reviews given: +50  (10 times)│
│                                         │
│ RECEIVING KARMA (+)                     │
│ 👍 Thanks received:      +45  (9 times) │
│ ⭐ Positive reviews:     +80  (8 times) │
│ 🔄 Repeat customers:     +75  (3 people)│
│                                         │
│ PENALTIES (-)                           │
│ ❌ Cancelled orders:     -50  (1 time)  │
│ 👻 No-shows:             0              │
│                                         │
└─────────────────────────────────────────┘
```

**Karma Levels:**
| Score | Level | Perks |
|-------|-------|-------|
| 0-99 | Newcomer | Basic features |
| 100-299 | Home Cook | Can post Wishes |
| 300-599 | Community Chef | Priority in wish fulfillment |
| 600-999 | Trusted Chef | Can open Ghost Kitchen |
| 1000+ | Kitchen Legend | Featured in community |

**How Karma Is Earned:**

**Positive Actions:**
- +10 per Cookie Beacon share
- +30 per Wish fulfilled
- +20 per Ghost Kitchen order completed
- +20 per dish brought to Party Mode
- +5 per thank-you received
- +10 per 5-star review received
- +25 per repeat customer

**Penalties:**
- -50 for cancelled Ghost Kitchen order
- -30 for no-show on claimed Beacon
- -20 for expired Beacon with pending claims
- -10 per negative review
- -100 for reported behavior

**Where Karma Matters:**

| Feature | Karma Impact |
|---------|-------------|
| **Wish Board** | High karma = wishes shown first |
| **Ghost Kitchen** | Required karma to open (300+) |
| **Cookie Beacon** | Karma badge shown to claimers |
| **Party Mode** | Hosts see karma before inviting |
| **Community** | High karma users get verified badge |

**Database:**
```prisma
model UserKarma {
  id              String   @id @default(uuid())
  userId          String   @unique
  totalScore      Int      @default(0)
  level           KarmaLevel @default(NEWCOMER)

  beaconShares    Int      @default(0)
  wishesFulfilled Int      @default(0)
  ordersCompleted Int      @default(0)
  thanksReceived  Int      @default(0)

  penaltyScore    Int      @default(0)
  cancellations   Int      @default(0)
  noShows         Int      @default(0)

  updatedAt       DateTime @updatedAt
}

model KarmaEvent {
  id        String   @id @default(uuid())
  userId    String
  eventType KarmaEventType
  points    Int
  reason    String
  createdAt DateTime @default(now())
}
```

**Why:** Creates accountability. Rewards reliable community members. Filters out bad actors naturally.

---

### 22. "Flavor Twins" (Taste Compatibility Matching)

**Concept:** Find other users with matching Flavor DNA profiles. Your culinary soulmates who can recommend recipes you'll actually love.

**How It Works:**

Flavor DNA comparison algorithm matches users:
```
🧬 YOUR FLAVOR TWINS

98% MATCH - @TacoTuesday_Tom
   ✓ Both love: spicy, garlic, lime, cilantro
   ✓ Both avoid: blue cheese, licorice
   ✓ Cuisine match: Mexican, Thai, Vietnamese
   ✓ Cook time: Both prefer under 30 min
   → Tom cooked 12 recipes you haven't tried!

94% MATCH - @PastaQueen_Paula
   ✓ Both love: parmesan, garlic, fresh herbs
   ✓ Similar heat tolerance (7/10 vs 8/10)
   ✓ Cuisine match: Italian, French, Mediterranean
   → Paula's "Cacio e Pepe" has 50 saves!

87% MATCH - @GrillMaster_Mike
   ✓ Both love: smoky, umami, charred flavors
   ⚠️ Heat difference (he's 9/10, you're 7/10)
   ✓ Cuisine match: BBQ, American, Korean
   → Mike's rubs might be too spicy for you

[See All Twins] [Find Twins Who Cook X]
```

**Features:**

**1. Twin-Powered Recommendations:**
```
📍 BECAUSE YOUR FLAVOR TWINS LOVED IT

"Spicy Vodka Rigatoni"
⭐ 4.9 from 12 of your Flavor Twins
🧬 97% predicted match for you

"Your twins say:"
• "The heat is perfect" - @TacoTuesday_Tom
• "Made it 3 times already" - @PastaQueen_Paula
```

**2. "What's My Twin Cooking?"**
Activity feed from your top matches:
```
👥 FLAVOR TWIN ACTIVITY

@TacoTuesday_Tom is cooking
  🍜 Pad Thai (right now!)
  You might like this → 96% match

@PastaQueen_Paula saved
  🍝 Truffle Carbonara
  4 of your twins saved this

@GrillMaster_Mike reviewed
  🍖 Korean BBQ Short Ribs → ⭐⭐⭐⭐⭐
  "Best ribs I've ever made"
```

**3. Twin Challenges:**
```
🎯 TWIN CHALLENGE

Cook the same recipe as your twin this week!
Both make: "Thai Basil Chicken"
Compare notes after → Share photos

[Accept Challenge] [Suggest Different Recipe]
```

**Privacy Controls:**
- Opt-in to Flavor Twins feature
- Control visibility (show to matches only)
- Anonymous mode (show DNA, hide profile)
- Block specific users

**Database:**
```prisma
model FlavorTwinMatch {
  id            String   @id @default(uuid())
  userId        String
  twinUserId    String
  matchScore    Float    // 0-100
  sharedLoves   String[] // ingredients both love
  sharedAvoids  String[] // ingredients both avoid
  cuisineMatch  String[] // overlapping cuisines
  calculatedAt  DateTime @default(now())

  @@unique([userId, twinUserId])
}
```

**API:**
```
GET /flavor-twins
Response: {
  twins: [
    { user: {...}, matchScore: 98, sharedTraits: [...] },
    ...
  ],
  twinActivity: [...],
  twinRecommendations: [...]
}
```

**Why:** Social proof for recipe discovery. "People like you loved this" is more powerful than generic ratings.

---

### 23. "The Kitchen Collab" (Real-Time Recipe Co-Creation)

**Concept:** Google Docs for recipes. Collaborate with friends on recipe development in real-time.

**Use Cases:**
- Developing a potluck dish together
- Family recipe project (collecting grandma's recipes)
- Food blogger collaboration
- Couples refining their signature dish

**The Experience:**
```
┌─────────────────────────────────────────────────┐
│ 📝 COLLABORATIVE RECIPE                         │
│ "Ultimate Party Dip" - Draft v3                 │
│ Editors: You ● @PartyPaula (editing now)        │
├─────────────────────────────────────────────────┤
│ INGREDIENTS                      💬 3 comments  │
│                                                 │
│ • 8 oz cream cheese             [Paula added]   │
│ • 1 cup sour cream                              │
│ • 1/4 cup hot sauce             💬              │
│   └─ You: "Too much?"                           │
│   └─ Paula: "Trust me on this one"              │
│ • 2 cups shredded chicken       [AI suggested]  │
│ • 1 cup cheddar, shredded       [You added]     │
│                                                 │
│ ──────────────────────────────────────────────  │
│ STEPS                                           │
│ 1. Preheat oven to 375°F        ✓ Both agreed  │
│ 2. Mix cream cheese and sour... [Paula typing] │
│    |                                            │
├─────────────────────────────────────────────────┤
│ 💬 CHAT                                         │
│ Paula: Should we add jalapeños?                 │
│ You: Yes! Pickled or fresh?                     │
│ 🤖 AI: "Pickled adds tang, fresh adds heat"     │
│ Paula: Let's do pickled                         │
│                                                 │
│ [Send message...]                    [📎] [🤖]  │
└─────────────────────────────────────────────────┘
```

**Features:**

**1. Real-Time Editing:**
- Multiple cursors (see where others are editing)
- Live sync (changes appear instantly)
- Conflict resolution for simultaneous edits

**2. Comments & Discussions:**
- Thread comments on any ingredient or step
- @mention collaborators
- Resolve/close discussion threads

**3. AI Assistant in Collab:**
- Suggest ingredients that complement
- Flag potential issues ("That's a lot of salt")
- Answer technique questions
- Mediate disagreements with facts

**4. Version History:**
```
📜 VERSION HISTORY

v3 (current) - 10 min ago
  Paula added jalapeños
  You adjusted hot sauce to 1/4 cup

v2 - 2 hours ago
  AI suggested shredded chicken
  Paula approved

v1 - Yesterday
  Initial draft from You

[Restore v2] [Compare versions]
```

**5. Fork & Merge:**
- Fork a collab recipe for personal experiments
- Propose merging changes back
- Vote on proposed changes

**Database:**
```prisma
model CollabRecipe {
  id            String   @id @default(uuid())
  title         String
  ownerId       String
  version       Int      @default(1)
  isPublished   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  collaborators CollabMember[]
  comments      CollabComment[]
  history       CollabVersion[]
}

model CollabMember {
  id            String   @id @default(uuid())
  recipeId      String
  userId        String
  role          CollabRole @default(EDITOR)
  joinedAt      DateTime @default(now())

  @@unique([recipeId, userId])
}

enum CollabRole {
  OWNER
  EDITOR
  VIEWER
  COMMENTER
}

model CollabComment {
  id            String   @id @default(uuid())
  recipeId      String
  userId        String
  targetType    String   // "ingredient", "step", "general"
  targetIndex   Int?
  content       String
  resolved      Boolean  @default(false)
  createdAt     DateTime @default(now())
}
```

**API:**
```
POST /collab/create - Create collaborative recipe
POST /collab/:id/invite - Invite collaborator
WS /collab/:id/sync - Real-time sync connection
POST /collab/:id/comment - Add comment
POST /collab/:id/publish - Publish final version
```

**Why:** Recipes are often collaborative ("Mom's recipe with my twist"). This formalizes and enhances that process.

---

### 24. "The Time Capsule" (Annual Cooking Journey)

**Concept:** Spotify Wrapped, but for your cooking. A beautiful year-in-review of your culinary journey.

**Generated Every December:**
```
┌─────────────────────────────────────────────────┐
│ 🗓️ YOUR 2024 COOKING JOURNEY                   │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ 📊 BY THE NUMBERS                               │
│                                                 │
│         147                                     │
│    Recipes Cooked                               │
│    ↑ 34% from 2023                              │
│                                                 │
│    23 Countries    4,200 XP    Level 12         │
│    Explored        Earned      Achieved         │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ 🏆 YOUR HIGHLIGHTS                              │
│                                                 │
│ MOST-MADE RECIPE                                │
│ 🍲 Mom's Chicken Soup                           │
│    Made 12 times (once a month!)                │
│                                                 │
│ BIGGEST CHALLENGE CONQUERED                     │
│ 🥐 Croissants from Scratch                      │
│    March 15 - "Finally nailed it!"              │
│                                                 │
│ MOST IMPROVED SKILL                             │
│ 🔪 Knife Skills: +340 XP                        │
│    You learned: julienne, brunoise, chiffonade  │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ 🧬 FLAVOR DNA EVOLUTION                         │
│                                                 │
│ Heat Tolerance:  5 → 7 (+2)  🔥                 │
│ "You got spicier this year!"                    │
│                                                 │
│ New Favorite: Miso                              │
│ "Appeared in 23 of your recipes"                │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ 👥 SOCIAL IMPACT                                │
│                                                 │
│ 🍪 Cookie Beacons: 34 activated                 │
│ 🍽️ Portions shared: 89                          │
│ 🏪 Ghost Kitchen orders: 12                     │
│ 🧬 Flavor Twins found: 3                        │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ 🌍 PASSPORT STAMPS (New in 2024)                │
│                                                 │
│    🇹🇭        🇵🇪        🇲🇦                      │
│ Thailand    Peru    Morocco                     │
│                                                 │
│ Badges Earned:                                  │
│ [Spice Lord] [Sauce Boss] [World Traveler]      │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ 📝 MEMORABLE NOTES YOU LEFT                     │
│                                                 │
│ March 15: "Finally nailed croissants! 🥐"       │
│ July 4: "Kids loved this one - make again"      │
│ Nov 28: "Never attempt soufflé for guests 😂"  │
│                                                 │
│ ════════════════════════════════════════════    │
│                                                 │
│ [Create Shareable Image] [View Full Stats]      │
│ [Download PDF Cookbook of 2024 Favorites]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Shareable Cards:**

Generate Instagram/social-ready images:
```
┌─────────────────────────────┐
│                             │
│   My 2024 in Cooking        │
│        🍳                   │
│                             │
│   147 recipes               │
│   23 countries              │
│   89 portions shared        │
│                             │
│   gramgrab.com/wrapped      │
│                             │
└─────────────────────────────┘
```

**Features:**
- Auto-generated every December
- Shareable image cards for social
- PDF export of year's favorite recipes
- Compare to previous years
- "2025 Goals" suggestions from AI

**Data Sources (aggregated from all features):**
- Recipe cook logs
- Flavor DNA changes
- Culinary RPG XP/badges
- Flavor Passport stamps
- Social activity (beacons, orders)
- Notes and ratings

**Why:** Highly shareable. Creates annual engagement spike. Emotional connection. "Look what I accomplished!"

---

## Phase: Far Future (Complex Infrastructure)

### 25. "Chef's Table Live" (Synchronized Remote Cooking)

**Concept:** Cook together in real-time, remotely. Host or join live cooking sessions with synchronized timers and video.

**⚠️ Note:** This is a complex feature requiring significant infrastructure (WebRTC, real-time sync, video processing). Planned for later phases after core social features are established.

**The Vision:**
```
┌─────────────────────────────────────────────────┐
│ 🍳 CHEF'S TABLE LIVE                            │
│ "Grandma's Lasagna Night"                       │
│ Host: Grandma Rose | 4 participants             │
├─────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│ │ 👵  │ │ 👨  │ │ 👩  │ │ 🧑  │ ← Video feeds  │
│ │Rose │ │Mike │ │Sarah│ │Alex │                │
│ └─────┘ └─────┘ └─────┘ └─────┘                │
├─────────────────────────────────────────────────┤
│ STEP 3 OF 12: Layer the noodles                 │
│                                                 │
│ ⏱️ SHARED TIMER: 45:00 until oven              │
│                                                 │
│ [Everyone Ready?] [Ask Question] [Show Camera]  │
└─────────────────────────────────────────────────┘
```

**Use Cases:**
- **Long-distance families:** Grandma teaches scattered grandkids
- **Date nights:** Couples in different cities cook together
- **Friend groups:** Saturday night cooking club
- **Influencer classes:** Paid cooking sessions
- **Team building:** Corporate cooking events

**Core Features:**
- Video grid of all participants
- Synchronized step progression (host controls)
- Shared timers (everyone's oven dings together)
- Voice/video chat
- "Show your progress" photo sharing
- Grand reveal at the end (everyone shows their plate)

**Technical Requirements:**
- WebRTC for video/audio
- Real-time state synchronization
- Timer sync across clients
- Scalable media server
- Recording/playback (optional)

**Monetization Potential:**
- Free for small groups (up to 4)
- Premium for larger groups
- Influencer "paid class" feature
- Corporate team-building packages

**Dependencies:**
- Party Mode (event infrastructure)
- Sous Chef AI (voice features)
- Insta-Chef Mode (video handling)

**Why (for later):** Transforms cooking from solitary to social. Creates powerful emotional connections. But requires significant technical investment.

---

## Phase: Foundational Infrastructure (Signature Systems)

*These aren't just features - they're the pillars that make GramGrab defensible and irreplaceable.*

### 26. "Salt Sense" (Real-Time Taste Calibration)

**Concept:** Transform "season to taste" from guesswork into personalized precision. The AI learns your exact seasoning preferences and guides you in real-time.

**Why This Is Gold:**
- Invisible AI that builds trust
- Requires long-term usage → retention engine
- Creates taste intelligence competitors can't copy

**What It Feels Like in Cook Mode:**

Instead of "season to taste," the AI says:
```
┌─────────────────────────────────────────┐
│ 🧂 SALT SENSE CHECK                     │
│                                         │
│ Pause here. Take a small bite.          │
│                                         │
│ Does it need:                           │
│                                         │
│ [More Salt] [More Acid] [More Heat]     │
│                                         │
│ [Too Salty] [Too Sour] [Perfect ✓]      │
└─────────────────────────────────────────┘
```

User taps "Slightly more salt"

AI responds:
```
"Add ¼ tsp salt now.
You typically prefer +12% salt vs. recipe baseline.
I'll remember this for future recipes."
```

**Progression:**

**🔧 MVP (Launch-Ready):**
- Simple feedback buttons mid-cook
- Adjusts quantities for THIS recipe only
- Stores preference signals in Flavor DNA
- Basic salt/acid/heat/sweet calibration

**🚀 v2 (Enhanced):**
- Differentiates TYPE of saltiness:
  - Savory vs briny
  - Soy-based vs mineral salt
  - Cheese-salty vs cured-meat-salty
- Adjusts FUTURE recipes automatically
- "You usually add 20% more garlic - want me to adjust?"

**🧠 Moat (Defensible):**
- Cross-recipe seasoning normalization
- Learns contextual preferences:
  - You like salty soups
  - But lighter pastas
  - Extra acid in Asian dishes
- Years of taste data = impossible to replicate

**Technical Integration:**
```typescript
// Salt Sense updates Flavor DNA in real-time
interface SeasoningFeedback {
  recipeId: string;
  stepIndex: number;
  feedbackType: 'salt' | 'acid' | 'heat' | 'sweet' | 'umami';
  adjustment: 'more' | 'less' | 'perfect';
  amount?: string; // "¼ tsp"
}

// Flavor DNA stores aggregate preferences
interface TasteCalibration {
  saltBias: number;      // +12% = likes saltier
  acidBias: number;      // -5% = prefers less acid
  heatBias: number;      // +30% = spice lover
  sweetBias: number;     // -15% = not a sweet tooth
  umamiAffinity: number; // +25% = umami seeker
}
```

**Database:**
```prisma
model SeasoningLog {
  id          String   @id @default(uuid())
  userId      String
  recipeId    String
  stepIndex   Int
  dimension   SeasoningDimension
  feedback    SeasoningFeedback
  adjustment  String?
  createdAt   DateTime @default(now())
}

enum SeasoningDimension {
  SALT
  ACID
  HEAT
  SWEET
  UMAMI
  BITTER
}

enum SeasoningFeedback {
  MUCH_MORE
  SLIGHTLY_MORE
  PERFECT
  SLIGHTLY_LESS
  MUCH_LESS
}
```

**Why This Matters:** Every recipe app tells you "season to taste." Only GramGrab learns what YOUR taste actually is.

---

### 27. "Dinner Circles" (Household Infrastructure)

**Concept:** Stop treating users as individuals. Families, roommates, and friend groups cook together. GramGrab becomes the system households depend on.

**Why This Is Gold:**
- Household lock-in (families don't switch apps)
- Long-term taste graph across multiple people
- Painful to leave once established

**How It Works:**

**Create a Circle:**
```
┌─────────────────────────────────────────┐
│ 👥 DINNER CIRCLES                       │
├─────────────────────────────────────────┤
│                                         │
│ 🏠 "Weeknight Family"                   │
│    Mom, Dad, Emma (8), Jake (12)        │
│    4 members • 47 meals together        │
│                                         │
│ 🏋️ "Gym Bros"                           │
│    You, Mike, Alex                      │
│    3 members • 12 meals together        │
│                                         │
│ 🏢 "Roommates"                          │
│    You, Sarah, Chris                    │
│    3 members • 23 meals together        │
│                                         │
│ [+ Create New Circle]                   │
└─────────────────────────────────────────┘
```

**Each Member Sets:**
- Allergies & restrictions
- Flavor DNA preferences
- Diet goals (optional)
- Portion preferences

**AI Adapts Per Person:**
```
🍝 Spaghetti Carbonara for "Weeknight Family"

PERSONALIZED PORTIONS:
• Dad:    Full portion, extra pepper
• Mom:    ¾ portion, light on cheese
• Emma:   ½ portion, no pepper (she hates it)
• Jake:   Full portion, extra parmesan

SHOPPING LIST: Adjusted for 3.25 portions

[Start Cooking] [Adjust Portions]
```

**Progression:**

**🔧 MVP (Launch-Ready):**
- Create private circles
- Shared weekly meal planning
- Aggregate dietary restrictions
- Single cook execution with combined preferences

**🚀 v2 (Enhanced):**
- Individual plate adjustments:
  - Less spice for kids
  - Extra protein for gym member
  - Dairy-free portion for one person
- Auto-generated shopping list for circle
- "Who's cooking tonight?" rotation
- Shared recipe voting

**🧠 Moat (Defensible):**
- Long-term household taste graph
- Cross-member preference learning
- "Your family loves X on Fridays" patterns
- Becomes painful to recreate elsewhere

**Circle + Salt Sense Integration:**
Salt Sense learns PER PERSON in a circle:
```
Cooking for "Weeknight Family"

Salt Sense knows:
• Dad: +15% salt bias
• Mom: -5% salt bias
• Kids: Standard

Suggestion: "Season the main pot to Mom's level.
Dad can add salt at the table."
```

**Database:**
```prisma
model DinnerCircle {
  id          String   @id @default(uuid())
  name        String
  emoji       String?
  createdBy   String
  createdAt   DateTime @default(now())

  members     CircleMember[]
  mealPlans   CircleMealPlan[]
}

model CircleMember {
  id          String   @id @default(uuid())
  circleId    String
  userId      String?  // null if pending invite
  email       String?
  nickname    String
  role        CircleRole @default(MEMBER)
  portionSize Float    @default(1.0)
  joinedAt    DateTime @default(now())

  circle      DinnerCircle @relation(fields: [circleId], references: [id])

  @@unique([circleId, userId])
}

enum CircleRole {
  OWNER
  ADMIN
  MEMBER
  CHILD  // simplified interface
}

model CircleMealPlan {
  id          String   @id @default(uuid())
  circleId    String
  recipeId    String
  plannedDate DateTime
  cookerId    String   // who's cooking
  status      MealStatus @default(PLANNED)

  circle      DinnerCircle @relation(fields: [circleId], references: [id])
}
```

**Why This Matters:** Recipe apps treat cooking as solo. Real life is families, roommates, couples. Own the household, own the user forever.

---

### 28. "Dynamic Grocery Optimization" (Immediate Monetization)

**Concept:** Real-time price awareness that saves money AND adjusts recipes. Your cleanest revenue lever.

**Why This Is Gold:**
- Clear monetization path
- Immediate tangible value ("I saved $12 this week")
- Creates habit (check prices before cooking)

**User Experience:**
```
┌─────────────────────────────────────────┐
│ 💰 SMART SWAP DETECTED                  │
├─────────────────────────────────────────┤
│                                         │
│ Chicken thighs are 28% cheaper than     │
│ chicken breasts this week at Walmart.   │
│                                         │
│ Your recipe calls for chicken breast.   │
│                                         │
│ If you swap:                            │
│ ✓ Save $4.20                            │
│ ✓ Recipe auto-adjusts cook time (+8min) │
│ ✓ Seasoning recalibrated for dark meat  │
│ ✓ Slightly higher fat, same protein     │
│                                         │
│ [Swap & Save $4.20] [Keep Original]     │
│                                         │
└─────────────────────────────────────────┘
```

**Progression:**

**🔧 MVP (Launch-Ready):**
- Location-based pricing (1-2 major grocers)
- Smart ingredient swaps with recipe adjustments
- Shopping list with prices
- "You saved $X this week" tracking

**🚀 v2 (Enhanced):**
- Multi-store optimization ("Costco for meat, Aldi for produce")
- Cost-per-meal breakdown
- Budget goals and tracking
- Store pickup/delivery integration
- Price alerts ("Salmon dropped 40%!")

**🧠 Moat (Defensible):**
- Price × Taste × Nutrition triangulation
- Knows YOUR swap tolerance:
  - "You'll swap chicken cuts but never beef quality"
  - "You prefer organic produce but conventional dairy"
- Historical price data for prediction

**Revenue Model:**
```
┌─────────────────────────────────────────┐
│ 💰 MONETIZATION                         │
├─────────────────────────────────────────┤
│                                         │
│ 1. AFFILIATE FEES                       │
│    • Commission per grocery order       │
│    • "Order from Walmart" → 3-5%        │
│                                         │
│ 2. PRO TIER UNLOCK                      │
│    • Free: 1 store, basic swaps         │
│    • Pro: Multi-store, all optimizations│
│                                         │
│ 3. SPONSORED SWAPS (ethically labeled)  │
│    • "Swap to Brand X" with disclosure  │
│    • Must be genuinely good swap        │
│                                         │
└─────────────────────────────────────────┘
```

**Integration with Other Features:**
| Feature | Grocery Optimization Integration |
|---------|----------------------------------|
| **Pantry Whisperer** | Only show items you actually need |
| **Budget Chef Mode** | Hit budget goals with real prices |
| **Dinner Circles** | Optimize for household quantities |
| **Stock Market** | Powers the price data layer |
| **Meal Prep Commander** | Bulk pricing for batch cooking |

**API:**
```typescript
interface GroceryOptimization {
  originalItem: Ingredient;
  swapSuggestion: Ingredient;
  savings: number;
  store: string;
  recipeAdjustments: {
    cookTimeChange: number;
    seasoningChanges: string[];
    nutritionDelta: NutritionDiff;
  };
  confidence: number; // how good is this swap
}

// Endpoint
POST /grocery/optimize
Body: {
  recipeId: string,
  location: { lat, lng },
  stores: string[], // preferred stores
  budgetGoal?: number
}
Response: {
  optimizedList: GroceryItem[],
  totalSavings: number,
  swapsMade: GroceryOptimization[],
  storeBreakdown: { store: string, items: [], subtotal: number }[]
}
```

**Why This Matters:** Every dollar saved is a reason to come back. This feature pays for itself.

---

### 29. "Creator Stores" (Platform Flywheel)

**Concept:** Let food creators monetize through GramGrab. They sell curated recipe packs; you take a cut. Everyone wins.

**Why This Is Gold:**
- Creators bring their audience TO you
- Revenue share model (recurring)
- Lock-in: creators can't export fork lineage + Flavor DNA tuning

**What Creators Sell:**
```
┌─────────────────────────────────────────┐
│ 🏪 CREATOR STORE: @MealPrepQueen        │
├─────────────────────────────────────────┤
│                                         │
│ 📦 "7-Day High Protein Pack"     $9.99  │
│    14 recipes • 150g+ protein/day       │
│    ⭐ 4.9 (342 purchases)               │
│                                         │
│ 📦 "Air Fryer Mastery"          $14.99  │
│    25 recipes • Beginner to advanced    │
│    ⭐ 4.8 (891 purchases)               │
│                                         │
│ 📦 "Mediterranean Starter"       $7.99  │
│    12 recipes • Flavor DNA optimized    │
│    ⭐ 4.7 (567 purchases)               │
│                                         │
│ 🆓 FREE SAMPLE: "3 Quick Dinners"       │
│    Try before you buy                   │
│                                         │
└─────────────────────────────────────────┘
```

**What Makes GramGrab Packs Special:**
- Not just recipes - they're **enhanced forks**
- Include Salt Sense calibration presets
- Optimized for Flavor DNA compatibility
- Fork lineage shows creator provenance
- Updates flow to purchasers (living documents)

**Progression:**

**🔧 MVP (Launch-Ready):**
- Creators upload recipe packs
- Simple pricing ($4.99 - $29.99)
- 70/30 revenue split (creator/platform)
- Basic analytics (sales, ratings)

**🚀 v2 (Enhanced):**
- Performance analytics dashboard
- Upsells inside Cook Mode ("Want the advanced version?")
- Subscription packs (monthly new recipes)
- Bundle deals
- Affiliate tracking for creators

**🧠 Moat (Defensible):**
- Creators can't export:
  - Fork lineage
  - Flavor DNA tuning
  - Salt Sense presets
  - User reviews/ratings
- Lock-in without hostility (they WANT to stay)

**Creator Dashboard:**
```
┌─────────────────────────────────────────┐
│ 📊 CREATOR DASHBOARD: @MealPrepQueen    │
├─────────────────────────────────────────┤
│                                         │
│ THIS MONTH                              │
│ 💰 Revenue: $2,847                      │
│ 📦 Sales: 312 packs                     │
│ ⭐ Avg Rating: 4.8                      │
│ 👥 New followers: 1,247                 │
│                                         │
│ TOP PERFORMERS                          │
│ 1. Air Fryer Mastery      $1,200       │
│ 2. High Protein Pack       $890        │
│ 3. Mediterranean           $457        │
│                                         │
│ INSIGHTS                                │
│ • Your "5-ingredient" recipes sell 3x  │
│ • Tuesday drops perform best           │
│ • Users fork your pasta dishes most    │
│                                         │
└─────────────────────────────────────────┘
```

**Database:**
```prisma
model CreatorStore {
  id            String   @id @default(uuid())
  userId        String   @unique
  storeName     String
  bio           String?
  avatarUrl     String?
  verified      Boolean  @default(false)
  totalSales    Int      @default(0)
  totalRevenue  Decimal  @default(0)
  createdAt     DateTime @default(now())

  packs         RecipePack[]
}

model RecipePack {
  id            String   @id @default(uuid())
  storeId       String
  title         String
  description   String
  price         Decimal
  coverImageUrl String?
  isActive      Boolean  @default(true)
  salesCount    Int      @default(0)
  avgRating     Float?
  createdAt     DateTime @default(now())

  recipes       PackRecipe[]
  purchases     PackPurchase[]
  store         CreatorStore @relation(fields: [storeId], references: [id])
}

model PackPurchase {
  id          String   @id @default(uuid())
  packId      String
  userId      String
  price       Decimal
  creatorCut  Decimal  // 70%
  platformCut Decimal  // 30%
  purchasedAt DateTime @default(now())

  pack        RecipePack @relation(fields: [packId], references: [id])
}
```

**Why This Matters:** Creators have audiences. You have infrastructure. Together = growth flywheel.

---

### 30. "Health Graph Integration" (The "Wow" Feature)

**Concept:** Connect cooking patterns to health outcomes. Not dieting - **behavior-aware cooking**.

**Why This Is Gold:**
- Feels 10 years ahead
- Food × physiology feedback loop is extremely rare
- Creates deep trust and perceived value

**What Users Feel:**
```
┌─────────────────────────────────────────┐
│ 🏥 HEALTH INSIGHTS                      │
├─────────────────────────────────────────┤
│                                         │
│ OBSERVATION:                            │
│ You sleep better on days you cook       │
│ meals with complex carbs for dinner.    │
│                                         │
│ CORRELATION:                            │
│ Sleep Score: 82 avg (with carbs)        │
│ Sleep Score: 71 avg (low-carb dinners)  │
│                                         │
│ SUGGESTION:                             │
│ Want me to suggest more whole-grain     │
│ dinner options on weeknights?           │
│                                         │
│ [Yes, optimize for sleep] [No thanks]   │
│                                         │
└─────────────────────────────────────────┘
```

**Not Dieting - Behavior Correlation:**
```
Examples of insights:

🏃 ENERGY
"You cook more consistently when meals are
higher in protein. Bias suggestions this week?"

😴 SLEEP
"Heavy meals after 8pm correlate with poor
sleep. Show earlier dinner recipes?"

💪 RECOVERY
"Post-workout days: you tend to choose
comfort food. Here are protein-rich comfort options."

🧠 MOOD
"Your cooking frequency drops when you
haven't had leafy greens in 3+ days. Coincidence?"
```

**Progression:**

**🔧 MVP (Launch-Ready):**
- Read-only health data (Apple Health, Google Fit)
- Basic correlation insights (weekly summary)
- Opt-in only, privacy-first
- No prescriptive advice (just observations)

**🚀 v2 (Enhanced):**
- Gentle nudges based on patterns
- Recovery-based meal suggestions
- "You have a big workout tomorrow" awareness
- Menstrual cycle awareness (optional, sensitive)
- Stress correlation with cooking patterns

**🧠 Moat (Defensible):**
- Food × physiology feedback loop
- Multi-year health-cooking correlation data
- Extremely rare in consumer apps
- Medical-grade trust potential

**Privacy-First Design:**
```
┌─────────────────────────────────────────┐
│ 🔒 HEALTH GRAPH PRIVACY                 │
├─────────────────────────────────────────┤
│                                         │
│ What we access:                         │
│ ✓ Sleep duration (not details)         │
│ ✓ Activity minutes (not GPS)           │
│ ✓ Heart rate trends (not raw data)     │
│                                         │
│ What we NEVER access:                   │
│ ✗ Medical records                       │
│ ✗ Medications                           │
│ ✗ Reproductive health                   │
│ ✗ Mental health data                    │
│                                         │
│ Your data:                              │
│ • Processed on-device when possible     │
│ • Never sold to third parties           │
│ • Deletable anytime                     │
│                                         │
│ [Manage Permissions] [Delete All Data]  │
└─────────────────────────────────────────┘
```

**Integration Points:**
| Health Signal | Cooking Response |
|---------------|------------------|
| Low sleep score | Suggest calming evening recipes |
| High activity day | Boost protein suggestions |
| Stress indicators | Comfort food that's still healthy |
| Recovery needed | Anti-inflammatory ingredients |
| Energy dip pattern | Balanced macro suggestions |

**API Integration:**
```typescript
interface HealthCorrelation {
  metric: 'sleep' | 'energy' | 'activity' | 'recovery';
  pattern: string;
  correlation: number; // -1 to 1
  confidence: number;
  suggestion?: {
    type: 'bias' | 'avoid' | 'timing';
    description: string;
    recipeFilters: RecipeFilter[];
  };
}

// Example response
{
  metric: 'sleep',
  pattern: 'complex_carbs_improve_sleep',
  correlation: 0.72,
  confidence: 0.85,
  suggestion: {
    type: 'bias',
    description: 'Include whole grains in evening meals',
    recipeFilters: [{ tag: 'whole-grain', mealType: 'dinner' }]
  }
}
```

**Why This Matters:** No recipe app connects what you eat to how you feel. This is genuine innovation.

---

## 🔗 How These 5 Features Interlock

```
┌─────────────────────────────────────────────────────────────┐
│                    THE GRAMGRAB ECOSYSTEM                    │
└─────────────────────────────────────────────────────────────┘

                         HEALTH GRAPH
                              │
                    "You sleep better with..."
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │              FLAVOR DNA                 │
         │    (Aggregate taste intelligence)       │
         └────────────────────────────────────────┘
                    ▲                    ▲
                    │                    │
              Learns per              Learns per
               person                 household
                    │                    │
              ┌─────┴─────┐        ┌─────┴─────┐
              │           │        │           │
         SALT SENSE    ◄──────►    DINNER CIRCLES
         (Individual       │       (Household
          calibration)     │        preferences)
              │            │              │
              └────────────┼──────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │   DYNAMIC GROCERY          │
              │   OPTIMIZATION             │
              │   (Price-aware cooking)    │
              └────────────────────────────┘
                           │
                    Monetization
                           │
                           ▼
              ┌────────────────────────────┐
              │   CREATOR STORES           │
              │   (Growth flywheel)        │
              └────────────────────────────┘
                           │
                    Creators bring
                     audiences
                           │
                           ▼
                    🚀 NETWORK EFFECTS
```

**The Reinforcement Loop:**

| Feature | Feeds Into | Gets Data From |
|---------|-----------|----------------|
| Salt Sense | Flavor DNA | Cook Mode |
| Dinner Circles | Household lock-in | Salt Sense per member |
| Grocery Optimization | Revenue | Pantry + Dinner Circles |
| Creator Stores | User acquisition | All features |
| Health Graph | Trust + differentiation | Activity + cooking logs |

---

## Priority Matrix

| Feature | Impact | Effort | Dependencies | Category |
|---------|--------|--------|--------------|----------|
| Dietary Shield | High | Medium | User profiles, AI | Safety |
| Fusion Kitchen | Medium | Low | Existing AI + Forking | AI |
| Heirloom Cookbook | Medium | Medium | PDF library | Export |
| Party Mode | High | High | Full new module | Social |
| Roast My Plate | Medium | Low | GPT-4 Vision | Entertainment |
| Culinary RPG | High | High | User system, tracking | Gamification |
| Mystery Box | Medium | Low | Existing AI | Entertainment |
| Flavor Passport | High | High | 3D lib, cuisine detection | Gamification |
| Copycat Cam | High | Medium | GPT-4 Vision | AI |
| Bistro Builder | Medium | Low | PDF generation | Export |
| Insta-Chef Mode | High | High | Video processing | Content |
| Stock Market | Medium | High | External APIs, data | Smart |
| Cookie Beacon | High | High | Push notifications, geolocation | Social |
| Wish Board | Low | Low | Cookie Beacon infrastructure | Social |
| Ghost Kitchen | High | High | Cookie Beacon, Bistro Builder | Social |
| Flavor DNA | Very High | Medium | ML/AI, behavior tracking | Personalization |
| Pantry Whisperer | Very High | High | OCR, ingredient database, AI | Utility |
| Seasonal Sage | Medium | Low | Seasonal data, Stock Market | Utility |
| Budget Chef Mode | High | Medium | Stock Market, Pantry, Flavor DNA | Utility |
| Sous Chef AI | High | High | Voice recognition, TTS | Accessibility |
| Recipe Rescue | High | Medium | GPT-4 Vision, AI | AI |
| Kitchen Karma | Medium | Medium | All social features | Social |
| Flavor Twins | Medium | Low | Flavor DNA | Social |
| Kitchen Collab | Medium | High | Real-time sync, WebSocket | Social |
| Time Capsule | High | Low | All tracking features | Engagement |
| Chef's Table Live | High | Very High | WebRTC, video, real-time sync | Far Future |
| **Salt Sense** | **Very High** | **Medium** | **Flavor DNA, Cook Mode** | **🏛️ Foundation** |
| **Dinner Circles** | **Very High** | **High** | **User system, Salt Sense** | **🏛️ Foundation** |
| **Dynamic Grocery Optimization** | **Very High** | **High** | **Stock Market, location APIs** | **🏛️ Foundation** |
| **Creator Stores** | **Very High** | **High** | **Forking, payments** | **🏛️ Foundation** |
| **Health Graph** | **High** | **Medium** | **Apple Health/Google Fit APIs** | **🏛️ Foundation** |

---

## Implementation Tiers

### 🏛️ Tier 0: Foundational Infrastructure (Build These First)
*These are the signature systems that make GramGrab defensible*

- **Salt Sense** - Real-time taste calibration, feeds Flavor DNA (MVP: feedback buttons in Cook Mode)
- **Flavor DNA** - Taste intelligence engine, powers everything (MVP: basic preference tracking)
- **Dinner Circles** - Household lock-in, multi-person meal planning (MVP: shared circles + restrictions)

### Tier 1: Quick Wins (Low effort, high impact)
- **Fusion Kitchen** - Mostly AI prompting + existing fork infrastructure
- **Mystery Box** - Simple AI prompt + ingredient input UI
- **Roast My Plate** - GPT-4 Vision + persona prompts (fun marketing potential)
- **Bistro Builder** - AI menu descriptions + PDF generation
- **Wish Board** - Simple addition to Cookie Beacon, gift economy bulletin board
- **Seasonal Sage** - Seasonal data integration, enhances Stock Market
- **Flavor Twins** - Matching algorithm on existing Flavor DNA
- **Time Capsule** - Aggregation of existing data, annual generation
- **Health Graph MVP** - Read-only Apple Health integration, basic correlations

### Tier 2: Medium Effort (Moderate complexity)
- **Dietary Shield** - High trust-building value, especially for families
- **Heirloom Cookbook** - "Delight" feature, perfect for holiday release
- **Copycat Cam** - GPT-4 Vision + recipe reverse-engineering
- **Recipe Rescue** - GPT-4 Vision + cooking troubleshooting AI
- **Budget Chef Mode** - Builds on Stock Market + Pantry + Flavor DNA
- **Kitchen Karma** - Reputation system across social features
- **Salt Sense v2** - Type differentiation (savory vs briny), auto-adjust future recipes

### Tier 3: Major Features (Significant development)
- **Party Mode** - Biggest lift but transforms app from tool to platform
- **Culinary RPG** - Requires full gamification system, but massive retention potential
- **Flavor Passport** - 3D globe rendering + cuisine detection system
- **Cookie Beacon** - Push notifications, geolocation, friend circles (high social impact)
- **Pantry Whisperer** - Daily utility feature, reduces food waste, high engagement
- **Ghost Kitchen** - Builds on Cookie Beacon + Bistro Builder for home restaurant experience
- **Sous Chef AI** - Voice recognition, TTS, hands-free cook mode
- **Kitchen Collab** - Real-time collaborative editing infrastructure
- **Dynamic Grocery Optimization** - Multi-store price optimization + AI swaps
- **Dinner Circles v2** - Individual plate adjustments, rotation scheduling

### Tier 4: Complex Infrastructure (External dependencies)
- **Insta-Chef Mode** - Video processing pipeline, FFmpeg, cloud compute
- **Stock Market** - External API integrations, real-time data feeds
- **Creator Stores** - Payment processing, creator dashboard, revenue split

### Tier 5: Far Future (Significant technical investment)
- **Chef's Table Live** - WebRTC, synchronized video, real-time state management
- **Health Graph v2** - Predictive nudges, workout-aware meal suggestions

---

## Strategic Build Order (Recommended)

```
PHASE 1: Foundation (Months 1-3)
├── Salt Sense MVP
├── Flavor DNA MVP
└── Dinner Circles MVP

PHASE 2: Monetization + Growth (Months 4-6)
├── Dynamic Grocery Optimization
├── Creator Stores MVP
└── Quick Wins (Mystery Box, Roast My Plate, etc.)

PHASE 3: Stickiness (Months 7-9)
├── Pantry Whisperer
├── Cookie Beacon + Wish Board
└── Health Graph MVP

PHASE 4: Platform (Months 10-12)
├── Ghost Kitchen
├── Culinary RPG
└── Party Mode
```

---

## Notes

- **🏛️ Foundational features** (Salt Sense, Dinner Circles, Grocery Optimization, Creator Stores, Health Graph) are the moat - build these with MVP→v2→Moat progression
- **Entertainment features** (Roast My Plate, Mystery Box) have high viral/shareability potential
- **Gamification** (Culinary RPG, Flavor Passport, Time Capsule) proven to increase retention
- **Social features** (Party Mode, Cookie Beacon, Ghost Kitchen, Flavor Twins) create organic growth
- **Safety features** (Dietary Shield) build trust and expand target audience
- **Content creation** (Insta-Chef Mode, Bistro Builder) turns users into marketing ambassadors
- **AI Vision features** (Copycat Cam, Roast My Plate, Recipe Rescue) leverage GPT-4 Vision
- **Smart features** (Stock Market, Pantry Whisperer, Seasonal Sage, Budget Chef) add daily utility
- **Personalization** (Flavor DNA, Salt Sense) is foundational - powers better recommendations across ALL features
- **Household lock-in** (Dinner Circles) - families don't switch apps, own the household = own the user
- **Accessibility** (Sous Chef AI) opens app to hands-on cooks and differentiates from competitors
- **Collaboration** (Kitchen Collab) formalizes how recipes are actually developed (with others)
- **Trust system** (Kitchen Karma) enables safe community interactions across all social features
- **Annual engagement** (Time Capsule) creates viral December spike like Spotify Wrapped
- **Revenue engines** (Dynamic Grocery, Creator Stores) provide clear path to profitability

---

*Last updated: December 2024*
