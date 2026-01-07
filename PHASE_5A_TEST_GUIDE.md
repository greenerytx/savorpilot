# Phase 5A: Potluck Planner - Test Guide

> **Created**: January 5, 2026
> **Status**: Complete
> **Purpose**: Document all Phase 5A features with testing instructions

---

## Overview

Phase 5A enhances the Party Events system by integrating it with Dinner Circles, adding dietary compatibility checking, and implementing shopping list generation from event recipes.

---

## Features Implemented

### 1. Circle Integration for Events

**Purpose**: Allow users to link Party Events to their Dinner Circles, enabling automatic dietary tracking and member management.

**Backend Changes**:
- Added `circleId` field to `PartyEvent` model in Prisma schema
- Added `GET /party-events/circles` endpoint to fetch user's circles for selection

**Frontend Changes**:
- Updated `CreateEventModal` with circle selection UI
- Shows all user's Dinner Circles with member counts

**How to Test**:
1. Navigate to `/events`
2. Click "Create Event"
3. Scroll to "Link to Dinner Circle (optional)" section
4. You should see:
   - "No circle" option (default)
   - All your Dinner Circles listed with emoji, name, and member count
5. Select a circle
6. Fill in other event details and create

**Expected Result**:
- Event is created with the circle linked
- Circle info appears on the event detail page

---

### 2. Auto-Import Circle Members

**Purpose**: When creating an event linked to a circle, automatically invite all circle members with their dietary restrictions and allergens.

**Backend Changes**:
- Added `importCircleMembers` flag to `CreatePartyEventDto`
- Service imports members with their dietary info on event creation
- Added `POST /party-events/:id/import-circle-members` for manual import

**Frontend Changes**:
- Checkbox in `CreateEventModal`: "Auto-invite circle members"
- "Import Circle Members" button on event detail page (for linked events)

**How to Test**:

*Test A: Auto-import on creation*
1. Create a new event
2. Select a Dinner Circle that has members
3. Check "Auto-invite circle members" (checked by default)
4. Create the event
5. Go to the event's "Guests" tab

**Expected Result**:
- All circle members appear in the guest list
- Their dietary restrictions/allergens are preserved
- RSVP status is "Pending"

*Test B: Manual import after creation*
1. Create an event linked to a circle WITHOUT auto-import
2. Go to the event detail page
3. Click "Import Circle Members" button (next to Share Link)

**Expected Result**:
- Toast shows "Imported X members from circle"
- Members appear in guest list
- If all members already exist, shows "All circle members are already in this event"

---

### 3. Circle Info Display on Event

**Purpose**: Show which Dinner Circle an event is linked to, with quick navigation.

**Frontend Changes**:
- Added circle emoji + name in event quick stats section
- Circle name is a clickable link to the circle page

**How to Test**:
1. Open any event that's linked to a circle
2. Look at the quick stats area (below event description)

**Expected Result**:
- See circle emoji and name (e.g., "🍝 Italian Nights")
- Clicking the name navigates to `/circles/{circleId}`
- Events without a linked circle don't show this section

---

### 4. Dietary Compatibility Badges

**Purpose**: Show at-a-glance warnings when a recipe conflicts with attendees' dietary restrictions or allergens.

**Backend Changes**:
- Added `GET /party-events/:id/recipes/:recipeId/compatibility` endpoint
- Checks recipe ingredients against all attending members' restrictions/allergens
- Returns detailed breakdown of conflicts

**Frontend Changes**:
- New `CompatibilityBadge` component in `EventRecipeBoard`
- Green badge: "Safe for all" (no conflicts)
- Red badge: "X allergens" (contains allergens)
- Amber badge: "X issues" (dietary restriction conflicts)
- Hover tooltip shows detailed breakdown

**How to Test**:
1. Create an event linked to a circle with members who have dietary restrictions
   - Example: Add a member with "Vegetarian" restriction and "Peanuts" allergen
2. Pin some recipes to the event
   - Pin a vegetarian recipe (no meat)
   - Pin a recipe with meat
   - Pin a recipe with peanuts
3. Go to "Recipes" tab and view the recipe board

**Expected Result**:
- Vegetarian recipe shows green "Safe for all" badge
- Recipe with meat shows amber badge with restriction warning
- Recipe with peanuts shows red badge with allergen warning
- Hovering shows: affected ingredient, type (allergen/restriction), and affected member names

---

### 5. Shopping List Generation

**Purpose**: Automatically generate a consolidated shopping list from all recipes pinned to an event, with smart ingredient aggregation.

**Backend Changes**:
- Added `PartyEventShoppingList` and `PartyEventShoppingItem` models
- Added `POST /party-events/:id/shopping-list/generate` endpoint
- Aggregates ingredients across all pinned recipes
- Scales quantities based on servings
- Categorizes ingredients (Produce, Dairy, Meat, Pantry, etc.)

**Frontend Changes**:
- New "Shopping" tab on event detail page
- New `EventShoppingList` component

**How to Test**:
1. Create an event and pin at least 2-3 recipes
2. Adjust servings on some recipes (e.g., scale up for more guests)
3. Go to the "Shopping" tab
4. Click "Generate Shopping List"

**Expected Result**:
- Toast shows "Shopping list created with X items"
- Items are grouped by category (Produce, Dairy, Meat, Seafood, Bakery, Pantry, Spices, Beverages, Other)
- Quantities are aggregated (e.g., 2 cups butter from one recipe + 1 cup from another = 3 cups)
- Quantities are scaled based on servings set on each pinned recipe

---

### 6. Shopping List Management

**Purpose**: Allow users to track their shopping progress by checking off items.

**Backend Changes**:
- Added `GET /party-events/:id/shopping-list` endpoint
- Added `POST /party-events/:id/shopping-list/:itemId/toggle` endpoint

**Frontend Changes**:
- Expandable category accordions
- Checkable items with visual feedback
- Progress bar showing completion percentage
- Category-level progress indicators

**How to Test**:
1. Generate a shopping list (see above)
2. Click on a category to expand it
3. Click the checkbox next to items to mark them as purchased
4. Observe the progress bar at the top

**Expected Result**:
- Clicking checkbox toggles item state
- Checked items show strikethrough text and green background
- Progress bar updates (e.g., "5 of 20 items checked")
- Category headers show individual progress (e.g., "Produce (3/7)")
- When all items checked, shows celebration message

---

### 7. Shopping List Refresh

**Purpose**: Regenerate the shopping list when recipes are added/removed or servings change.

**How to Test**:
1. Generate a shopping list
2. Go back to "Recipes" tab
3. Pin another recipe or change servings
4. Return to "Shopping" tab
5. Click "Refresh" button

**Expected Result**:
- List regenerates with updated ingredients
- Previously checked items are reset (fresh list)
- New items from added recipes appear
- Toast confirms regeneration

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/party-events/circles` | GET | Get user's circles for event creation |
| `/party-events/:id/import-circle-members` | POST | Import members from linked circle |
| `/party-events/:id/recipes/:recipeId/compatibility` | GET | Check recipe dietary compatibility |
| `/party-events/:id/shopping-list/generate` | POST | Generate shopping list from recipes |
| `/party-events/:id/shopping-list` | GET | Get event shopping list |
| `/party-events/:id/shopping-list/:itemId/toggle` | POST | Toggle item checked state |

---

## Components Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| `CreateEventModal` | `/components/party-events/` | Updated with circle selection |
| `EventRecipeBoard` | `/components/party-events/` | Added CompatibilityBadge |
| `CompatibilityBadge` | (inline in EventRecipeBoard) | Shows dietary conflict warnings |
| `EventShoppingList` | `/components/party-events/` | New shopping list UI |
| `PartyEventDetailPage` | `/pages/party-events/` | Added Shopping tab, Import button |

---

## Hooks Summary

| Hook | Purpose |
|------|---------|
| `useCirclesForEventCreation()` | Fetch circles for CreateEventModal |
| `useImportCircleMembers()` | Import members from circle |
| `useRecipeCompatibility(eventId, recipeId)` | Check recipe compatibility |
| `useEventShoppingList(eventId)` | Fetch shopping list |
| `useGenerateShoppingList()` | Generate new shopping list |
| `useToggleShoppingItem()` | Toggle item checked state |

---

## Database Schema Changes

```prisma
model PartyEvent {
  // ... existing fields
  circleId     String?              @map("circle_id") @db.Uuid
  circle       DinnerCircle?        @relation(fields: [circleId], references: [id])
  shoppingList PartyEventShoppingList?

  @@index([circleId])
}

model PartyEventShoppingList {
  id        String   @id @default(uuid()) @db.Uuid
  eventId   String   @unique @map("event_id") @db.Uuid
  event     PartyEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  items     PartyEventShoppingItem[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}

model PartyEventShoppingItem {
  id             String   @id @default(uuid()) @db.Uuid
  shoppingListId String   @map("shopping_list_id") @db.Uuid
  shoppingList   PartyEventShoppingList @relation(...)
  ingredient     String
  quantity       Float?
  unit           String?
  category       String   @default("Other")
  isChecked      Boolean  @default(false) @map("is_checked")
  recipeId       String?  @map("recipe_id") @db.Uuid
  assignedToId   String?  @map("assigned_to_id") @db.Uuid
  assignedTo     PartyEventMember? @relation(...)
}
```

---

## Edge Cases to Test

1. **Event without circle**: Should work normally, no circle features shown
2. **Empty circle**: Import should show "0 members imported"
3. **All members already imported**: Should show appropriate message
4. **Recipe with no ingredients**: Should be skipped in shopping list
5. **Event with no recipes**: Shopping tab shows "Add some recipes first"
6. **Duplicate ingredients across recipes**: Should be aggregated correctly
7. **Different units for same ingredient**: Creates separate line items (can't reliably convert)

---

## Known Limitations

1. Ingredient aggregation only combines items with the same unit
2. Quantity parsing is basic - complex fractions may not combine perfectly
3. Ingredient categorization is based on keyword matching, may miscategorize some items
4. Shopping list doesn't persist check state across regeneration

---

## Future Enhancements (Not Implemented)

- Assign shopping items to specific members
- Share shopping list externally
- Smart unit conversion (e.g., 4 tbsp → 1/4 cup)
- Ingredient substitution suggestions based on dietary restrictions
- Cost estimation for shopping list
