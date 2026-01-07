# GramGrab - AI Documentation Guide

This guide is for AI assistants browsing the GramGrab application to create visual documentation.

---

## Application URLs

**Base URL**: `http://localhost:5173` (development)

---

## Page-by-Page Documentation Instructions

### 1. Authentication Pages

#### Login Page
**URL**: `/login`

**Screenshot Requirements**:
- Full login form with email/password fields
- "Login" button
- Link to registration

**Key Elements to Document**:
- Form validation messages
- Error states (wrong password, user not found)
- "Remember me" option if present

#### Register Page
**URL**: `/register`

**Screenshot Requirements**:
- Full registration form
- All required fields (name, email, password)
- Password requirements display

---

### 2. Home Page (Dashboard)
**URL**: `/`

**Screenshot Requirements**:
1. Full page overview showing all sections
2. Statistics cards close-up
3. Quick action buttons
4. Recent recipes section

**Key Elements to Document**:
- Stats display (total recipes, weekly additions, favorites)
- Quick action cards (Add Recipe, Generate, Collections, Saved Posts)
- Recent recipe cards
- Welcome message/greeting

---

### 3. Recipes List Page
**URL**: `/recipes`

**Screenshot Requirements**:
1. Full page with grid view
2. Full page with list view
3. Search bar in action
4. Filter panel expanded
5. Single recipe card close-up
6. Empty state (if no recipes)
7. Pagination controls

**Key Elements to Document**:
- Search functionality
- Filter options (Category, Cuisine, Difficulty, Time)
- View toggle (grid/list)
- Sort dropdown
- Recipe card components (image, title, badges, time, actions)

**Interactions to Capture**:
- Typing in search bar
- Clicking filter dropdown
- Hovering over recipe card (action buttons appear)

---

### 4. Recipe Detail Page
**URL**: `/recipes/:id` (use a real recipe ID)

**Screenshot Requirements**:
1. Header section with image and metadata
2. Overview tab
3. Ingredients tab with serving adjuster
4. Steps tab
5. Nutrition tab
6. Notes tab
7. Share button/modal

**Key Elements to Document**:
- Recipe image display
- Title, category, cuisine badges
- Time indicators (prep, cook, total)
- Difficulty indicator
- Favorite button (heart)
- Edit/Delete/Share buttons
- Tab navigation
- Ingredient list with checkboxes
- Step numbering and formatting
- Nutrition facts layout
- Personal vs shared notes

**Interactions to Capture**:
- Clicking serving size +/- buttons
- Checking off ingredients
- Switching between tabs
- Opening share modal

---

### 5. Recipe Submission Page
**URL**: `/recipes/new`

**Direct Navigation URLs**:
- `/recipes/new` - Mode selection screen
- `/recipes/new?source=instagram` - Instagram import screen
- `/recipes/new?source=url` - URL import mode
- `/recipes/new?source=text` - Text paste mode
- `/recipes/new?source=image` - Image upload mode

**Screenshot Requirements**:
1. Import method selection (all 4 options visible) - `/recipes/new`
2. Text input mode - `/recipes/new?source=text`
3. URL input mode - `/recipes/new?source=url`
4. **Instagram import mode** - `/recipes/new?source=instagram`
5. Image upload mode (drag-drop area) - `/recipes/new?source=image`
6. Manual entry form (full)
7. AI parsing in progress (loading state)
8. Parsed result preview
9. Success message after save

**Key Elements to Document**:

**Text Input Mode** (`?source=text`):
- Large text area for pasting
- "Parse Recipe" button
- Loading indicator during AI processing

**URL Input Mode** (`?source=url`):
- URL input field
- Supported sites hint
- Instagram URL example

**Instagram Import Mode** (`?source=instagram`):
- Instagram branded header with gradient icon
- URL input field with Instagram placeholder
- Helpful tip box about caption extraction
- Back and Extract Recipe buttons
- Clean, focused single-purpose UI

**Image Upload Mode** (`?source=image`):
- Drag-and-drop zone
- File size limit (20MB)
- Supported formats
- Preview of uploaded image

**Manual Entry Mode**:
- Title and description fields
- Ingredient addition (add row, quantity, unit, ingredient)
- Step addition (add step, numbered list)
- Category and cuisine dropdowns
- Time inputs (prep, cook)
- Difficulty selector
- Servings input
- Tags input
- Image upload

---

### 6. Recipe Edit Page
**URL**: `/recipes/:id/edit`

**Screenshot Requirements**:
1. Edit form pre-populated with recipe data
2. Ingredient editing
3. Step editing/reordering
4. Save/Cancel buttons

**Key Elements to Document**:
- Same as manual entry but with existing data
- Changes highlighted if applicable
- Cancel confirmation

---

### 7. Recipe Generation Page
**URL**: `/generate`

**Screenshot Requirements**:
1. Empty state - ingredient input
2. Ingredients added
3. Preference options expanded
4. Generation in progress
5. Generated recipe preview
6. Edit before save option

**Key Elements to Document**:
- Ingredient input field
- Ingredient chips/tags
- Cuisine selector
- Difficulty selector
- Meal type selector
- Dietary restrictions checkboxes
- "Generate Recipe" button
- Generated recipe display
- Edit and Save buttons

---

### 8. Collections Page
**URL**: `/collections`

**Screenshot Requirements**:
1. Collection grid view
2. Collection list view
3. Create new collection modal/form
4. Empty state

**Key Elements to Document**:
- Collection cards (cover image, name, recipe count)
- Create collection button
- Search/filter collections
- Grid/list toggle

---

### 9. Collection Detail Page
**URL**: `/collections/:id`

**Screenshot Requirements**:
1. Collection header with details
2. Recipes within collection
3. Add recipe to collection interface
4. Reorder recipes (drag handles visible)

**Key Elements to Document**:
- Collection name and description
- Recipe count
- Add recipes button
- Recipe grid/list within collection
- Edit collection button
- Share collection button
- Remove recipe option

---

### 10. Smart Collection Detail Page
**URL**: `/collections/smart/:id`

**Screenshot Requirements**:
1. Smart collection with filter badge
2. Auto-populated recipes
3. Filter rules display

**Key Elements to Document**:
- "Smart" indicator/badge
- Filter rules shown
- Auto-updating notice
- Matching recipes display

---

### 11. Create Smart Collection
**URL**: Access via Collections page

**Screenshot Requirements**:
1. Create smart collection modal
2. Filter rule configuration
3. Preview of matching recipes
4. Save button

**Key Elements to Document**:
- Filter type dropdown (Category, Cuisine, Difficulty, Time, Tags)
- Filter value selection
- Add multiple filters
- AND/OR logic if present
- Preview count/list
- Collection name input

---

### 12. Saved Posts Page (Instagram)
**URL**: `/saved-posts`

**Screenshot Requirements**:
1. Full page with pending posts
2. Status tabs (Pending, In Progress, Imported, Dismissed)
3. Search and filter bar
4. Single post card close-up
5. Caption preview modal
6. Parse with AI result
7. Import modal
8. Bulk selection mode
9. Import progress modal
10. Extension help modal

**Key Elements to Document**:
- Status tabs and counts
- Search bar
- Filter dropdowns (Account, Collection)
- Sort dropdown
- Grid/list toggle
- Post card elements:
  - Image thumbnail
  - Username
  - Caption preview
  - Likes/comments count
  - Status badge
  - Action buttons (Parse, Translate, Import, Dismiss)
- Caption modal with full text
- AI parsing result overlay
- Import form pre-populated
- Progress indicators
- Extension download/help

**Interactions to Capture**:
- Clicking status tabs
- Opening caption modal
- Clicking "Parse with AI"
- Selecting posts for bulk action
- Import progress animation

---

### 13. Shared Recipes Page
**URL**: `/shared`

**Screenshot Requirements**:
1. "Shared With Me" tab
2. "Shared By Me" tab
3. Shared recipe card with permissions
4. Modify permissions interface

**Key Elements to Document**:
- Tab navigation (Shared With Me / Shared By Me)
- Shared recipe cards showing:
  - Who shared
  - When shared
  - Permission level icon
  - Expiration date if set
- Revoke access button
- Modify permissions option

---

### 14. Settings Page
**URL**: `/settings`

**Screenshot Requirements**:
1. Profile tab
2. Preferences tab
3. Notifications tab
4. Security tab

**Key Elements to Document**:

**Profile Tab**:
- Avatar upload
- Name input
- Email input (with change option)
- Save button

**Preferences Tab**:
- Default servings dropdown
- Measurement units toggle (Metric/Imperial)
- Theme toggle (Light/Dark)
- Language selector

**Notifications Tab**:
- Toggle switches for each notification type
- Categories of notifications

**Security Tab**:
- Change password form
- Current password, new password, confirm
- Delete account button (with warning)

---

## Common UI Elements to Document

### Navigation
- Sidebar with all menu items
- Active state highlighting
- User avatar/menu in sidebar
- Language switcher
- Mobile responsive sidebar (hamburger menu)

### Notifications
- Notification bell icon with count
- Notification dropdown panel
- Individual notification items
- Mark as read button
- Delete notification

### Modals
- Standard modal with header/body/footer
- Close button (X)
- Confirm/Cancel buttons
- Loading states within modals

### Forms
- Input field states (empty, focused, filled, error)
- Dropdown selectors
- Multi-select chips
- Toggle switches
- Radio buttons
- Checkboxes

### Cards
- Recipe cards in grid
- Recipe cards in list
- Collection cards
- Post cards (Instagram)
- Stat cards

### Buttons
- Primary button (coral/terracotta)
- Secondary button
- Outline button
- Ghost button
- Destructive button (delete actions)
- Disabled states
- Loading states

### Toasts/Alerts
- Success toast (green)
- Error toast (red)
- Warning toast (yellow)
- Info toast (blue)

### Loading States
- Skeleton loaders
- Spinner indicators
- Progress bars
- "Processing" overlays

### Empty States
- No recipes message
- No collections message
- No shared recipes message
- No saved posts message

---

## Workflows to Document with Screenshots

### Workflow 1: Import Recipe from URL

1. Go to `/recipes/new`
2. Select "URL" import method
3. Paste a recipe URL
4. Click "Extract Recipe"
5. Show loading state
6. Show parsed result (switches to manual entry form with pre-filled data)
7. Review and edit fields
8. Click "Save Recipe"
9. Show success redirect to recipe page

### Workflow 1b: Import Recipe from Instagram (Direct)

1. Go to `/recipes/new?source=instagram`
2. See focused Instagram import screen with branded header
3. Paste Instagram post URL in the input field
4. Click "Extract Recipe"
5. Show loading state ("Extracting Recipe...")
6. Show parsed result (switches to manual entry form with pre-filled data)
7. Review and edit fields
8. Click "Save Recipe"
9. Show success redirect to recipe page

### Workflow 2: Import from Instagram

1. Go to `/saved-posts`
2. Show pending posts
3. Click on a post card to preview caption
4. Click "Parse with AI"
5. Show AI parsing result
6. Click "Import"
7. Show import modal with pre-filled data
8. Click "Save"
9. Show post status change to "Imported"

### Workflow 3: Generate Recipe

1. Go to `/generate`
2. Add ingredients one by one
3. Select cuisine preference
4. Select difficulty
5. Choose dietary restrictions
6. Click "Generate Recipe"
7. Show loading state
8. Show generated recipe preview
9. Make edits if needed
10. Save recipe

### Workflow 4: Create Smart Collection

1. Go to `/collections`
2. Click "New Smart Collection"
3. Enter collection name
4. Add filter rule (e.g., Category = Dinner)
5. See preview of matching recipes
6. Save collection
7. View smart collection page

### Workflow 5: Share Recipe

1. Go to `/recipes/:id`
2. Click "Share" button
3. Search for user by email
4. Select user
5. Choose permission level
6. Optionally set expiration
7. Click "Share"
8. Show success message

### Workflow 6: Translate Recipe

1. Go to `/recipes/:id`
2. Click "Translate" button
3. Show loading state
4. Show translated content
5. Toggle between original and translated

---

## Screenshot Naming Convention

Use this format: `{section}_{page}_{element}_{state}.png`

Examples:
- `auth_login_form_empty.png`
- `auth_login_form_error.png`
- `recipes_list_grid_view.png`
- `recipes_list_filter_expanded.png`
- `recipes_detail_ingredients_tab.png`
- `recipes_new_url_parsing.png`
- `instagram_posts_caption_modal.png`
- `settings_preferences_tab.png`

---

## Notes for AI Documentation

1. **Capture All States**: Empty, loading, success, error
2. **Show Interactions**: Hover states, click results
3. **Mobile Views**: If responsive, capture mobile layouts
4. **RTL Layout**: Capture Arabic language version for RTL documentation
5. **Accessibility**: Note any a11y features (keyboard navigation, ARIA labels)
6. **Consistency**: Use same browser size for all screenshots
7. **Annotations**: Mark key UI elements in screenshots if possible

---

## Recommended Browser Settings

- **Resolution**: 1920x1080 (full page) or 1280x800 (compact)
- **Browser**: Chrome (latest)
- **Device Simulation**: Desktop, Tablet, Mobile
- **Dark Mode**: Capture both light and dark themes if available

---

*This guide should enable comprehensive visual documentation of the GramGrab application.*
