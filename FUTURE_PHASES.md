# GramGrab Future Phases Roadmap

> **Strategic Vision Document** - Created: January 4, 2026
>
> This document outlines the transformation of GramGrab from a recipe manager into a **premier Social Cooking Platform** (like Strava or GitHub for food).

---

## Executive Summary

GramGrab has a powerful backend engine with sophisticated features that are currently under-utilized in the UI. This roadmap prioritizes **surfacing existing capabilities** before building new ones.

### Strategic Insight

> "You have the engine of a high-end social cooking network, but the body (UI/UX) is currently designed as a standard recipe manager."

### Priority Approach

1. **Phase 4 Completion**: Quick Wins - Expose hidden backend power (LOW effort, HIGH impact)
2. **Phase 5A**: Social Enhancement - Add missing social utility (MEDIUM effort, HIGH impact)
3. **Phase 5B**: Real-Time Features - Advanced engagement (HIGH effort, NICHE but VIRAL impact)
4. **Phase 6**: Creative Features - Gamification & fun features
5. **Phase 7**: Platform Scale - Full social platform capabilities

---

## Phase 4 Completion: Quick Wins (Backend Exists - UI Only)

> **Theme**: "Unlock the Hidden Power"
>
> These features require **minimal backend work** because the logic already exists. Focus is purely on frontend exposure.
>
> **These are now part of Phase 4** to complete the 85% → 100% gap.

### 4.1: "Make it Vegan" Button (Diet Auto-Fork)

**What**: One-click dietary adaptation buttons on any recipe card/detail page.

**Why**: Solves the #1 pain point of social cooking - dietary inclusion. Instant value.

**UI Placement**:
- Recipe detail page header: "Quick Adapt" dropdown
- Recipe card hover: Quick action buttons

**Available Templates** (already in backend):
| Template | Description |
|----------|-------------|
| `vegan` | Remove animal products, add plant alternatives |
| `gluten-free` | Substitute wheat/gluten ingredients |
| `keto` | Low-carb, high-fat modifications |
| `low-carb` | Reduce carbohydrate content |
| `low-sodium` | Reduce salt, use herb alternatives |
| `dairy-free` | Remove dairy, add alternatives |
| `paleo` | Whole foods, remove processed items |
| `halal` | Halal-compliant modifications |
| `kosher` | Kosher-compliant modifications |
| `quick` | Speed-optimized shortcuts |
| `budget` | Cost-effective substitutions |
| `spicier` / `milder` | Heat level adjustments |

**Backend Endpoints** (EXIST):
```
GET  /fork-enhancements/auto-fork/templates
GET  /fork-enhancements/auto-fork/templates/by-category
GET  /fork-enhancements/recipes/:recipeId/auto-fork/preview/:templateId
POST /fork-enhancements/recipes/:recipeId/auto-fork/:templateId
```

**Frontend Work**:
1. `QuickAdaptDropdown.tsx` - Dropdown with template categories
2. `AutoForkPreviewModal.tsx` - Show preview before creating
3. Update `RecipeCard.tsx` with quick action button
4. Update `RecipeDetailHeader.tsx` with prominent adapt button

**Effort**: LOW | **Impact**: HIGH

---

### 4.2: Recipe Match Score (Flavor DNA Integration)

**What**: Show "94% Match for You" on recipe cards based on user's flavor profile.

**Why**: Personalization drives engagement. A 3-star recipe might be a 5-star match for ME.

**How It Works** (backend logic exists):
- Scores recipes 0-100 based on:
  - Cuisine match (0-40 points)
  - Complexity match (0-20 points)
  - Cook time match (0-20 points)
  - Popularity boost (0-10 points)
  - Freshness boost (0-10 points)

**Backend Endpoints** (EXIST):
```
GET  /flavor-dna/profile           # User's taste profile
GET  /flavor-dna/recommendations   # Pre-scored recipes
```

**Frontend Work**:
1. `MatchScoreBadge.tsx` - Visual score indicator (ring chart or percentage)
2. Modify `RecipeCard.tsx` to display match score
3. Add "For You" filter to recipe list
4. Update `RecipeDetailPage.tsx` with personalization insight

**New API Needed** (simple):
```
GET /flavor-dna/recipes/:recipeId/match-score
```
Returns: `{ score: 94, breakdown: { cuisine: 38, complexity: 20, ... } }`

**Effort**: LOW | **Impact**: HIGH

---

### 4.3: Risk & Trust Indicators

**What**: Display "Success Probability" and trust badges on recipe cards.

**Why**: Social trust. "This recipe has High Risk (only 1 cook)" vs "Crowd Favorite (98% success rate)"

**Backend Exists**:
- `getForkOutcomePrediction()` returns:
  - Risk level (low/medium/high)
  - Confidence percentage
  - Risk factors list
  - Positive factors list
  - Recommendation (proceed/caution/not_recommended)

- `getForkValidationStats()` returns:
  - Total cooks, success rate, average rating
  - "Would make again" percentage
  - Earned badges:
    - `VERIFIED` (5+ successful cooks)
    - `HIGHLY_RATED` (avg rating ≥3.5)
    - `TIME_ACCURATE` (70%+ accuracy)
    - `CROWD_FAVORITE` (80%+ would make again)
    - `PHOTO_VERIFIED` (3+ photos)
    - `QUICK_WIN` (85%+ success, reliable)

**Backend Endpoints** (EXIST):
```
GET /fork-enhancements/recipes/:recipeId/validation-stats
GET /fork-enhancements/recipes/:recipeId/outcome-prediction
```

**Frontend Work**:
1. `TrustBadges.tsx` - Display earned badges (verified, crowd favorite, etc.)
2. `RiskIndicator.tsx` - Visual risk level (green/yellow/red)
3. `SuccessRate.tsx` - "87% Success Rate" display
4. Update `RecipeCard.tsx` and `RecipeDetailPage.tsx`

**Effort**: LOW | **Impact**: MEDIUM-HIGH

---

### 4.4: Visual Recipe Genealogy (Fork Tree)

**What**: Interactive family tree showing recipe lineage - who forked from whom.

**Why**: Users can trace a viral recipe back to the original. Gives credit, encourages remixing.

**Backend Exists**:
- `getForkLineage()` returns:
  - `ancestors[]` - Chain back to original
  - `descendants[]` - Direct forks (max 20)
  - Each node has: id, title, author, voteCount, createdAt

**Backend Endpoint** (EXISTS):
```
GET /fork-enhancements/recipes/:recipeId/lineage
```

**Frontend Work**:
1. `RecipeGenealogyTree.tsx` - Interactive node graph
2. Use library: `react-flow` or `d3-hierarchy`
3. Node design: Recipe card mini-preview
4. Click node to navigate to that recipe
5. Add "View Family Tree" button to recipe detail

**Effort**: MEDIUM (UI complexity) | **Impact**: MEDIUM

---

### 4.5: Enhanced "Cooked It" Flow

**What**: When user logs "I Made It", automatically generate a Cooking Post + Review.

**Why**: Fills the Activity Feed with content without extra effort from users.

**Current Flow** (disconnected):
1. User clicks "Made It" → Creates CookingReview
2. User separately creates CookingPost (optional)

**New Flow** (integrated):
1. User clicks "Made It"
2. Modal collects: Photo, Rating, Notes, Seasoning Feedback
3. System creates BOTH:
   - `CookingReview` (for Flavor DNA)
   - `CookingPost` (for social feed, if public)

**Backend Endpoints** (EXIST separately):
```
POST /flavor-dna/reviews        # Creates review
POST /cooking-posts             # Creates post
```

**Frontend Work**:
1. Merge `MadeItModal.tsx` and `CreatePostModal.tsx`
2. Add checkbox: "Share to my feed" (default ON)
3. Single submission creates both records
4. Success shows: "Posted to your feed!"

**Effort**: LOW | **Impact**: MEDIUM

---

### 4.6: Batch Actions on Recipes

**What**: Multi-select recipes in list view with batch operations (tag, move, visibility, share).

**Why**: Power user efficiency. Organize imported recipes quickly.

**Key Features**:
- Checkbox selection in recipe list (already exists for visibility)
- Extend to: bulk tagging, move to collection, share
- "Select all on page" / "Select all matching filter"
- Action bar appears when items selected

**Backend**: Extend existing bulk visibility endpoint pattern.

**Effort**: LOW | **Impact**: MEDIUM

---

### 4.7: Auto-Tagging on Import

**What**: AI automatically suggests tags and category when importing recipes.

**Why**: Reduces manual work. Imported recipes are immediately organized.

**Key Features**:
- Analyze recipe title, ingredients, description
- Suggest: category, cuisine, dietary tags, difficulty
- Quick edit chips to accept/reject suggestions
- Learn from user corrections over time

**Backend**: Leverage existing AI/categorization logic.

**Effort**: LOW | **Impact**: HIGH

---

### 4.8: One-Tap "Add All to Shopping List"

**What**: Single button to add all ingredients from collection or meal plan to shopping list.

**Why**: Massive time saver. Current flow requires adding each recipe individually.

**Key Features**:
- "Add All to List" button on collections
- "Add Week to List" button on meal planner
- Automatic ingredient deduplication and combining
- Option to select specific days/recipes first

**Backend**: Shopping list aggregation endpoint exists - extend it.

**Effort**: LOW | **Impact**: HIGH

---

### 4.9: Duplicate Detector on Import

**What**: Detect potential duplicate recipes during import and offer merge/keep options.

**Why**: Prevents clutter. Users often save same recipe multiple times.

**Key Features**:
- Compare title, ingredients, source URL on import
- Show "Similar recipe found" modal
- Options: Keep both, Replace, Merge (keep best of both)
- Confidence score for match quality

**Backend**: Fuzzy matching logic needed.

**Effort**: MEDIUM | **Impact**: MEDIUM

---

### 4.10: AI Scaling with Nutrition Confirmation

**What**: When scaling servings, show updated nutrition and confirm before saving.

**Why**: Clarity on what changes. Nutrition recalculation is non-obvious.

**Key Features**:
- Scaling slider/input (exists)
- Preview panel showing: new quantities, new nutrition
- "Apply Changes" confirmation button
- Option to save as new fork vs update original

**Backend**: Scaling logic exists - add nutrition recalc.

**Effort**: LOW | **Impact**: MEDIUM

---

## Phase 5A: Social Enhancement (Medium Effort)

> **Theme**: "Make Groups Useful"
>
> These features require some backend work but leverage existing infrastructure.

### 5A.1: Group Flavor Palette

**What**: Aggregate Flavor DNA for a Dinner Circle to show group preferences.

**Why**: Solves "What should we eat?" for groups. Shows: "This group is Spicy | Italian | No Cilantro"

**Backend Work Needed**:
```typescript
// New endpoint in dinner-circles.controller.ts
GET /dinner-circles/:id/flavor-palette

// Returns aggregated profile:
{
  memberCount: 4,
  consensusProfile: {
    cuisineAffinities: { italian: 0.8, mexican: 0.7 },
    spiceLevel: "medium",  // consensus
    restrictions: ["vegetarian", "no-nuts"],  // union of all
    allergens: ["peanuts", "shellfish"],  // union of all
    avoidIngredients: ["cilantro", "olives"]
  },
  compatibility: {
    easyToPlease: true,  // high overlap
    conflictAreas: ["spice level"]  // disagreements
  }
}
```

**Implementation**:
1. New service method: `getCircleFlavorPalette(circleId)`
2. Aggregate `FlavorProfile` for all member users
3. Handle virtual members (use their restrictions only)

**Frontend Work**:
1. `CircleFlavorPalette.tsx` - Visual profile summary
2. `CircleCompatibilityScore.tsx` - Show on recipe cards
3. Update `DinnerCirclePage.tsx` with palette section

**Effort**: MEDIUM | **Impact**: HIGH

---

### 5A.2: Private Circle Challenges

**What**: Allow challenges scoped to a Dinner Circle (e.g., "Family Best Burger Weekend")

**Why**: Public challenges are intimidating. Private ones are fun and encourage participation.

**Backend Changes**:
```typescript
// Update CookingChallenge model (Prisma schema)
model CookingChallenge {
  // ... existing fields
  circleId    String?              // NEW: optional circle scope
  circle      DinnerCircle?        @relation(...)
  isPrivate   Boolean @default(false)
}

// Update challenges.service.ts
- getChallenges() filters by circleId if provided
- createChallenge() accepts optional circleId
- Only circle members can view/participate
```

**Frontend Work**:
1. Update `CreateChallengeModal.tsx` with circle selector
2. Add "Circle Challenges" tab to `ChallengesPage.tsx`
3. Show circle badge on challenge cards
4. Filter challenges by "My Circles"

**Effort**: MEDIUM | **Impact**: HIGH

---

### 5A.3: Potluck Planner (Events for Circles)

**What**: Create events within a Circle where members claim recipes to bring.

**Why**: Moves app from virtual to real-world utility. Killer social feature.

**New Database Models**:
```prisma
model CircleEvent {
  id           String   @id @default(cuid())
  circleId     String
  circle       DinnerCircle @relation(...)
  name         String
  description  String?
  date         DateTime
  location     String?
  status       EventStatus @default(PLANNING)
  createdBy    String
  createdAt    DateTime @default(now())

  claims       EventRecipeClaim[]
}

model EventRecipeClaim {
  id           String   @id @default(cuid())
  eventId      String
  event        CircleEvent @relation(...)
  memberId     String   // DinnerCircleMember
  member       DinnerCircleMember @relation(...)
  recipeId     String?
  recipe       Recipe? @relation(...)
  itemName     String   // "Dessert" if no recipe linked
  status       ClaimStatus @default(CLAIMED)
  notes        String?
  createdAt    DateTime @default(now())
}

enum EventStatus {
  PLANNING
  CONFIRMED
  COMPLETED
  CANCELLED
}

enum ClaimStatus {
  CLAIMED
  CONFIRMED
  COMPLETED
}
```

**New Backend Module**: `circle-events/`
```
POST   /circle-events                    # Create event
GET    /circle-events/circle/:circleId   # List circle events
GET    /circle-events/:id                # Get event details
PUT    /circle-events/:id                # Update event
DELETE /circle-events/:id                # Cancel event
POST   /circle-events/:id/claims         # Claim a dish
PUT    /circle-events/:id/claims/:claimId
DELETE /circle-events/:id/claims/:claimId
```

**Frontend Components**:
1. `CircleEventsList.tsx`
2. `CreateEventModal.tsx`
3. `EventDetailPage.tsx`
4. `ClaimRecipeModal.tsx`
5. `PotluckChecklist.tsx`

**Social Hook**: "I'm bringing [Spicy Lasagna]. Click to view the recipe."

**Effort**: HIGH | **Impact**: VERY HIGH

---

### 5A.4: Calendar Sync (Google/Apple)

**What**: Sync meal plans to Google Calendar or Apple Calendar.

**Why**: Meal plans visible alongside other life events. Reminders to prep/cook.

**Key Features**:
- OAuth connect to Google/Apple Calendar
- Export meal plan as calendar events
- Include recipe link and prep time in event
- Two-way sync option (add meal from calendar)
- Reminder notifications before cook time

**Backend**: Calendar API integrations (Google Calendar API, Apple CalDAV).

**Effort**: MEDIUM | **Impact**: HIGH

---

### 5A.5: Household Mode (Shared Pantry + Meal Plan)

**What**: Shared pantry inventory and collaborative meal planning with role-based access.

**Why**: Families/roommates coordinate meals. Reduces "what do we have?" questions.

**Key Features**:
- Shared pantry inventory within Dinner Circle
- Roles: Admin, Planner, Shopper, Viewer
- Shared weekly meal plan with assignments
- "Who's cooking tonight?" indicator
- Pantry auto-deduct when recipe is cooked

**Backend**: Extend DinnerCircle with pantry and role models.

**Effort**: HIGH | **Impact**: HIGH

---

## Phase 5B: High-Impact Social Additions (Near-Term)

> **Theme**: "Public Presence & Social Proof"
>
> These features transform GramGrab from a personal tool into a discoverable social platform.

### 5B.1: Public Recipe Pages + SEO Discovery Hub

**What**: SEO-friendly public recipe pages with tags, cuisines, and trending sections.

**Why**: Enables organic discovery. Users can share recipes and get found via search.

**Key Features**:
- Public recipe URLs: `/r/spicy-tuscan-chicken`
- Discovery hub: Browse by tags, cuisines, trending
- SEO meta tags for social sharing
- Sitemap generation for search engines

**Effort**: MEDIUM | **Impact**: VERY HIGH

---

### 5B.2: Creator Profiles with Follow/Subscribe

**What**: Public chef profiles with follow functionality and personalized feed blending.

**Why**: Builds creator economy. Users follow their favorite home chefs.

**Key Features**:
- Public profile pages: `/chef/username`
- Follow/unfollow functionality
- "Following" feed blended with recommendations
- Creator stats: followers, recipes, forks, total cooks

**Effort**: MEDIUM | **Impact**: HIGH

---

### 5B.3: Ratings + Reviews + "Made It" Photo Posts

**What**: Full ratings/reviews system with photo posts to build social proof.

**Why**: Trust signals drive engagement. "47 people made this with 4.8 stars"

**Key Features**:
- Star ratings (1-5) with written reviews
- "Made It" photo gallery on each recipe
- Review sorting (most helpful, recent, with photos)
- Reviewer badges (verified cook, top reviewer)

**Effort**: MEDIUM | **Impact**: HIGH

---

### 5B.4: Comment Threads with @Mentions

**What**: Discussion threads on recipes with @mentions and notifications.

**Why**: Community engagement. Questions, tips, and modifications shared publicly.

**Key Features**:
- Threaded comments with replies
- @mention users with notifications
- Upvote helpful comments
- Creator can pin "Chef's tips" comments

**Effort**: MEDIUM | **Impact**: HIGH

---

### 5B.5: Shareable Recipe Cards & Embeds

**What**: Beautiful recipe cards for social platforms and blog embeds.

**Why**: Viral distribution. Easy sharing to Instagram, Pinterest, blogs.

**Key Features**:
- One-click generate shareable image card
- oEmbed support for blog embedding
- Pinterest-optimized format
- "Get the recipe" link attribution
- **QR code generation** for quick mobile sharing
- Print-friendly recipe card with QR code

**Effort**: LOW | **Impact**: HIGH

---

### 5B.6: Saved Searches + Smart Alerts

**What**: Save search queries and get notifications when new matching recipes appear.

**Why**: Discovery without effort. "Tell me when new Thai recipes under 30 min are added."

**Key Features**:
- Save current search as named alert
- Configure notification frequency (instant, daily, weekly)
- Alert triggers: new public recipes, new forks, trending
- Smart suggestions: "Recipes like ones you've saved"
- Manage alerts in settings

**Backend**: Search subscription model + notification scheduler.

**Effort**: MEDIUM | **Impact**: MEDIUM

---

## Phase 5C: Real-Time Features (High Effort)

> **Theme**: "Live Cooking Together"
>
> These features require WebSocket infrastructure but create viral engagement.

### 5C.1: Cook-Along Mode

**What**: Two+ users cook a recipe simultaneously with synced progress.

**Why**: "Date night" for long-distance couples. Cooking parties with friends.

**Technical Requirements**:
1. **WebSocket Gateway** (NestJS):
```typescript
@WebSocketGateway()
export class CookAlongGateway {
  @SubscribeMessage('joinSession')
  handleJoin(client, { sessionId, recipeId });

  @SubscribeMessage('updateStep')
  handleStepUpdate(client, { sessionId, stepIndex });

  @SubscribeMessage('sendReaction')
  handleReaction(client, { sessionId, emoji });

  @SubscribeMessage('chatMessage')
  handleChat(client, { sessionId, message });
}
```

2. **Session Management**:
```prisma
model CookAlongSession {
  id          String   @id @default(cuid())
  recipeId    String
  recipe      Recipe   @relation(...)
  hostId      String
  host        User     @relation(...)
  currentStep Int      @default(0)
  status      SessionStatus @default(WAITING)
  createdAt   DateTime @default(now())
  expiresAt   DateTime

  participants CookAlongParticipant[]
}
```

3. **Frontend**:
- `CookAlongLobby.tsx` - Create/join session
- `CookAlongView.tsx` - Synced cook mode
- `ParticipantList.tsx` - Show who's cooking
- `CookAlongChat.tsx` - Real-time chat overlay
- `ReactionBar.tsx` - Emoji reactions

**Effort**: HIGH | **Impact**: NICHE but VIRAL

---

## Phase 6: Creative Features

> From original roadmap - Gamification & creative tools

### 6.1: Side-by-Side Recipe Comparison

**What**: Compare original recipe vs fork vs your edits in a visual diff view.

**Why**: Understand exactly what changed. Great for learning techniques.

**Key Features**:
- Three-column comparison view
- Highlight additions (green), removals (red), changes (yellow)
- Ingredient quantity diff visualization
- Step-by-step comparison with change indicators
- "Apply this change to mine" quick action
- Export comparison as image/PDF

**Frontend**: Complex diff UI with synchronized scrolling.

**Effort**: MEDIUM | **Impact**: MEDIUM

---

### 6.2: Fusion Kitchen
- Merge 2 recipes into creative fusion
- AI analyzes both and suggests combinations
- Creates new hybrid recipe

### 6.3: Dietary Shield Safe Mode
- Auto-substitute allergens when viewing recipes
- "View as Nut-Free" toggle
- Leverages existing allergen detection

### 6.4: Heirloom Cookbook PDF
- Export collections as beautiful PDF
- Multiple themes (vintage, modern, minimal)
- Include family notes and photos

### 6.5: Mystery Box Challenge
- Random ingredient generator
- "Use these 5 ingredients" mode
- Shareable challenges

### 6.6: Budget Chef Mode
- Cost-optimized meal planning
- Integrate with grocery store APIs
- Weekly budget tracking

### 6.7: Roast My Plate
- AI food critic with personas
- Gordon Ramsay mode, Kind Grandma mode
- Entertaining feedback on cooking posts

### 6.8: Culinary RPG
- Skill tree (Baker, Grill Master, etc.)
- Achievement system
- Unlock badges and titles

---

## Phase 7: Platform Scale

> Long-term vision - Full social cooking platform

### 7.1: Collaborative Cooking Sessions
- Live cook-along with shared timers and chat
- Video call integration for remote cooking
- Synced recipe progress across participants

### 7.2: Group Meal Planning + Shared Shopping
- Shared shopping lists for dinner circles
- Collaborative weekly meal planning
- Role-based access (planner, shopper, cook)

### 7.3: Seasonal Challenges & Badges
- Time-limited seasonal cooking challenges
- Badges tied to forks, cooks, and collections
- Leaderboards and achievement showcases

### 7.4: Fork Competitions
- "Best fork" highlights and voting
- Lineage leaderboards (most forked recipes)
- Weekly/monthly fork showdowns

### 7.5: Co-Authoring & Remix Templates
- Collaborative collection editing
- Remix templates for community mashups
- Multi-author recipe attribution

### 7.6: Party Mode
- Collaborative event planning
- Shared shopping lists
- Assignment management

### 7.7: Cookie Beacon
- Local food sharing
- "Neighbor baked cookies" notifications
- Community building

### 7.8: Ghost Kitchen
- Home restaurant simulator
- Menu creation and pricing
- Order simulation

### 7.9: Insta-Chef Mode
- Auto-generate cooking videos from steps
- AI voiceover
- Social sharing

### 7.10: Sous Chef AI
- Full voice control
- Hands-free cooking mode
- "Hey Chef" wake word

---

## Priority Matrix

| Feature | Phase | Effort | Impact | Priority | Status |
|---------|-------|--------|--------|----------|--------|
| Make it Vegan Button | **4** | LOW | HIGH | **P0** | **DONE** |
| Recipe Match Score | **4** | LOW | HIGH | **P0** | **DONE** |
| Risk & Trust Indicators | **4** | LOW | MEDIUM-HIGH | **P0** | **DONE** |
| Enhanced Cooked It Flow | **4** | LOW | MEDIUM | **P0** | **DONE** |
| Recipe Genealogy Tree | **4** | MEDIUM | MEDIUM | **P1** | Planned |
| Batch Actions on Recipes | **4** | LOW | MEDIUM | **P1** | Planned |
| Auto-Tagging on Import | **4** | LOW | HIGH | **P1** | Planned |
| Add All to Shopping List | **4** | LOW | HIGH | **P1** | Planned |
| Duplicate Detector | **4** | MEDIUM | MEDIUM | **P2** | Planned |
| AI Scaling + Nutrition | **4** | LOW | MEDIUM | **P2** | Planned |
| Group Flavor Palette | 5A | MEDIUM | HIGH | **P1** | Planned |
| Private Circle Challenges | 5A | MEDIUM | HIGH | **P1** | Planned |
| Potluck Planner | 5A | HIGH | VERY HIGH | **P2** | Planned |
| Calendar Sync | 5A | MEDIUM | HIGH | **P2** | Planned |
| Household Mode | 5A | HIGH | HIGH | **P2** | Planned |
| Public Recipe Pages + SEO | 5B | MEDIUM | VERY HIGH | **P1** | Planned |
| Creator Profiles + Follow | 5B | MEDIUM | HIGH | **P1** | Planned |
| Ratings + Reviews | 5B | MEDIUM | HIGH | **P1** | Planned |
| Comment Threads | 5B | MEDIUM | HIGH | **P2** | Planned |
| Shareable Cards/Embeds + QR | 5B | LOW | HIGH | **P1** | Planned |
| Saved Searches + Alerts | 5B | MEDIUM | MEDIUM | **P2** | Planned |
| Cook-Along Mode | 5C | HIGH | NICHE/VIRAL | **P3** | Planned |
| Side-by-Side Comparison | 6 | MEDIUM | MEDIUM | **P3** | Planned |
| Collaborative Sessions | 7 | HIGH | HIGH | **P4** | Future |
| Group Meal Planning | 7 | HIGH | HIGH | **P4** | Future |
| Seasonal Challenges | 7 | MEDIUM | MEDIUM | **P4** | Future |
| Fork Competitions | 7 | MEDIUM | MEDIUM | **P4** | Future |
| Co-Authoring Collections | 7 | HIGH | MEDIUM | **P4** | Future |

### Recommended Order

**Phase 4 Completion** (P0/P1 - Quick Wins):
1. ✅ Make it Vegan Button
2. ✅ Recipe Match Score
3. ✅ Risk & Trust Indicators
4. ✅ Enhanced Cooked It Flow
5. Recipe Genealogy Tree
6. Batch Actions on Recipes
7. Auto-Tagging on Import
8. Add All to Shopping List
9. Duplicate Detector
10. AI Scaling + Nutrition

**Phase 5A** (P1/P2 - Social Groups):
11. Group Flavor Palette
12. Private Circle Challenges
13. Potluck Planner
14. Calendar Sync
15. Household Mode

**Phase 5B** (P1/P2 - Public Presence):
16. Public Recipe Pages + SEO
17. Creator Profiles + Follow
18. Ratings + Reviews
19. Shareable Cards/Embeds + QR
20. Comment Threads
21. Saved Searches + Alerts

**Phase 5C** (P3 - Real-Time):
22. Cook-Along Mode

**Phase 6** (P3 - Creative):
23. Side-by-Side Comparison
24. Fusion Kitchen, Culinary RPG, etc.

**Phase 7** (P4 - Platform Scale):
25. Collaborative Sessions, Fork Competitions, etc.

---

## Technical Requirements Summary

### No Backend Changes Needed (UI Only)
- Make it Vegan Button
- Risk & Trust Indicators
- Enhanced Cooked It Flow
- Batch Actions (extend existing)
- Add All to Shopping List
- Shareable Cards + QR

### Minor Backend Changes
- Recipe Match Score (1 new endpoint)
- Private Circle Challenges (add circleId to existing model)
- Auto-Tagging on Import (extend import flow)
- AI Scaling + Nutrition (extend scaling endpoint)

### New Backend Module
- Potluck Planner (new entity + CRUD)
- Group Flavor Palette (new aggregation endpoint)
- Duplicate Detector (fuzzy matching service)
- Calendar Sync (external API integration)
- Household Mode (extend DinnerCircle)
- Creator Profiles + Follow (user relationships)
- Ratings + Reviews (extend recipe model)
- Comment Threads (new comments module)
- Saved Searches + Alerts (search subscriptions)

### New Infrastructure
- Cook-Along Mode (WebSocket gateway)
- Push Notifications (for alerts)

---

## Success Metrics

### Engagement Targets
- Auto-fork usage: 20% of recipes viewed
- Match score engagement: 30% click-through on "For You"
- Trust badge influence: 15% higher conversion on badged recipes
- Circle challenge participation: 50% of circle members

### Social Targets
- Cooking post creation: 40% of "Made It" actions
- Potluck event creation: 2+ per active circle/month
- Cook-along sessions: Viral growth metric

---

*This document should be reviewed quarterly and updated based on user feedback and analytics.*
