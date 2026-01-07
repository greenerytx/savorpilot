# GramGrab User Guide

A comprehensive guide to using the GramGrab recipe management application.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Getting Started](#getting-started)
3. [Pages & Features](#pages--features)
   - [Home Page (Dashboard)](#home-page-dashboard)
   - [Recipes List Page](#recipes-list-page)
   - [Recipe Detail Page](#recipe-detail-page)
   - [Recipe Submission Page](#recipe-submission-page-importing-recipes)
   - [Recipe Edit Page](#recipe-edit-page)
   - [Recipe Generation Page](#recipe-generation-page)
   - [Collections Page](#collections-page)
   - [Smart Collections](#smart-collections)
   - [Saved Posts Page (Instagram)](#saved-posts-page-instagram-integration)
   - [Shared Recipes Page](#shared-recipes-page)
   - [Settings Page](#settings-page)
4. [Key Features](#key-features)
   - [Recipe Translation](#recipe-translation)
   - [Serving Size Adjuster](#serving-size-adjuster)
   - [Sharing Recipes](#sharing-recipes)
   - [Chrome Extension](#chrome-extension-for-instagram)
5. [Coming Soon](#coming-soon)

---

## Application Overview

**GramGrab** is an AI-powered recipe management application that helps you:
- Import recipes from text, URLs, images, or Instagram
- Generate new recipes from available ingredients
- Organize recipes into collections
- Share recipes with others
- Translate recipes between English and Arabic

### Supported Languages
- English (EN)
- Arabic (AR) with full RTL support

Use the language switcher in the navigation to change languages.

---

## Getting Started

### Login/Registration

**Route: `/login` and `/register`**

1. Navigate to the login page
2. Enter your email and password
3. Click "Login" to access your account

For new users:
1. Click "Register" or navigate to `/register`
2. Fill in your name, email, and password
3. Submit to create your account
4. You'll be redirected to the login page

---

## Pages & Features

### Home Page (Dashboard)

**Route: `/`**

The dashboard is your starting point showing:

#### Statistics Section
- Total number of recipes you have
- Recipes added this week/month
- Favorite recipes count
- Collection count

#### Quick Actions
- **Add New Recipe** - Jump to recipe submission
- **Generate Recipe** - Create a recipe from ingredients
- **View Collections** - Browse your collections
- **Saved Posts** - Access Instagram saved posts

#### Recent Recipes
- Displays your most recently added recipes
- Quick access to view or edit

#### Activity Overview
- Recent activity on your account
- Shared recipe notifications
- Import status updates

---

### Recipes List Page

**Route: `/recipes`**

Browse, search, and filter all your recipes.

#### Features

**Search Bar**
- Type to search recipes by name, description, or ingredients
- Search is debounced for performance

**Filters**
- **Category**: Breakfast, Lunch, Dinner, Dessert, etc.
- **Cuisine**: Italian, Mexican, Middle Eastern, etc.
- **Difficulty**: Easy, Medium, Hard, Expert
- **Time**: Filter by prep/cook time
- **Tags**: Custom tags you've added

**View Modes**
- **Grid View**: Card-based layout with images
- **List View**: Compact list with key details

**Sorting**
- Sort by: Name, Date Added, Prep Time, Difficulty
- Ascending or descending order

**Pagination**
- Navigate through pages of recipes
- Adjust items per page (10, 20, 50)

#### Recipe Cards Display
Each recipe card shows:
- Recipe image (or placeholder)
- Recipe name
- Category and cuisine badges
- Prep/cook time
- Difficulty indicator
- Favorite button (heart icon)
- Quick action menu (edit, delete, share)

---

### Recipe Detail Page

**Route: `/recipes/:id`**

View complete recipe details in a tabbed interface.

#### Header Section
- Large recipe image
- Recipe title
- Category and cuisine badges
- Difficulty rating
- Time indicators (prep, cook, total)
- Action buttons: Edit, Share, Favorite, Delete

#### Tabs

**1. Overview Tab**
- Recipe description
- Serving size with adjuster (+/-)
- Quick stats summary

**2. Ingredients Tab**
- Complete ingredient list
- Quantities adjust based on serving size
- Checkboxes to mark ingredients as gathered

**3. Steps Tab**
- Step-by-step cooking instructions
- Numbered steps with detailed instructions
- Tips and notes per step (if available)

**4. Nutrition Tab**
- Nutritional information per serving
- Calories, protein, carbs, fat
- Vitamins and minerals (if available)
- AI-estimated values are marked as estimates

**5. Notes Tab**
- Personal notes (only visible to you)
- Shared notes (visible to anyone you share with)
- Add/edit notes functionality

#### Translation Feature
- "Translate" button in header
- Translates recipe to English and Arabic
- Translations are saved for future access
- Switch between original and translated versions

---

### Recipe Submission Page (Importing Recipes)

**Route: `/recipes/new`**

Add new recipes using multiple input methods.

#### Direct Navigation Routes

You can navigate directly to specific import modes using query parameters:

| Route | Description |
|-------|-------------|
| `/recipes/new` | Shows mode selection (text, URL, image, manual) |
| `/recipes/new?source=instagram` | Direct Instagram URL import screen |
| `/recipes/new?source=url` | Direct URL import mode |
| `/recipes/new?source=text` | Direct text paste mode |
| `/recipes/new?source=image` | Direct image upload mode |

#### Import Methods

**1. Text Input** (`/recipes/new?source=text`)
- Paste recipe text from any source
- AI automatically parses:
  - Ingredients with quantities
  - Step-by-step instructions
  - Recipe metadata (title, category, cuisine, time)
- Review and edit parsed data before saving

**2. URL Import** (`/recipes/new?source=url`)
- Paste a recipe URL (food blogs, recipe sites)
- Supports Instagram post URLs
- AI extracts recipe data from the page
- Handles schema.org structured data automatically
- Falls back to AI parsing for non-standard sites

**3. Instagram Import** (`/recipes/new?source=instagram`)
- Dedicated screen for importing from Instagram
- Paste an Instagram post URL
- AI extracts recipe from the post caption
- Features Instagram branding and helpful tips
- Best for posts with recipes in captions

**4. Image Import (OCR)** (`/recipes/new?source=image`)
- Upload a photo of a recipe
- Supports: cookbook pages, handwritten recipes, screenshots
- Drag-and-drop or click to upload
- Max file size: 20MB
- Powered by GPT-4 Vision
- Review extracted data before saving

**5. Manual Entry**
- Full form for entering recipe manually
- Fields include:
  - Title and description
  - Ingredients (add multiple)
  - Steps (add multiple)
  - Category and cuisine
  - Prep time, cook time
  - Difficulty level
  - Servings
  - Tags
  - Image upload

#### After Import
1. Review the extracted/entered data
2. Make any necessary corrections
3. Click "Save Recipe"
4. Redirected to the new recipe detail page

---

### Recipe Edit Page

**Route: `/recipes/:id/edit`**

Edit existing recipes with the same form as manual entry.

#### Editable Fields
- All recipe fields are editable
- Modify ingredients, steps, metadata
- Update or replace recipe image
- Add/remove tags

#### Version History
- Recipe versions are auto-saved
- Access previous versions if needed

---

### Recipe Generation Page

**Route: `/generate`**

Create new recipes using AI based on ingredients you have.

#### How to Use

1. **Enter Ingredients**
   - List the ingredients you have available
   - Add one ingredient at a time or comma-separated

2. **Set Preferences**
   - **Cuisine**: Select preferred cuisine style
   - **Difficulty**: Choose desired difficulty level
   - **Meal Type**: Breakfast, Lunch, Dinner, or Snack
   - **Dietary Restrictions**: Vegetarian, Vegan, Gluten-Free, etc.

3. **Generate Recipe**
   - Click "Generate Recipe"
   - AI creates a complete recipe using your ingredients
   - Preview the generated recipe

4. **Review & Save**
   - Edit any details as needed
   - Click "Save Recipe" to add to your collection
   - Or generate a new variation

---

### Collections Page

**Route: `/collections`**

Organize recipes into custom collections.

#### Features

**View Collections**
- Grid or list view of all collections
- Collection cover image (from first recipe)
- Recipe count per collection
- Last updated date

**Create Collection**
- Click "New Collection"
- Enter collection name and description
- Add recipes from your library
- Set cover image

**Collection Actions**
- Edit collection details
- Delete collection (recipes not deleted)
- Share collection with others
- Reorder recipes within collection

---

### Collection Detail Page

**Route: `/collections/:id`**

View and manage recipes within a collection.

#### Features
- Collection header with name and description
- Grid/list view of recipes in collection
- Add more recipes to collection
- Remove recipes from collection
- Drag-and-drop to reorder recipes
- Share entire collection

---

### Smart Collections

**Route: `/collections/smart/:id`**

Auto-populating collections based on filter rules.

#### How Smart Collections Work

1. **Define Filters**
   - Category (e.g., all Dinner recipes)
   - Cuisine (e.g., all Italian recipes)
   - Difficulty (e.g., Easy recipes only)
   - Time (e.g., Quick meals under 30 minutes)
   - Tags (e.g., all "healthy" tagged recipes)
   - Source (e.g., all Instagram imports)

2. **Automatic Population**
   - Recipes matching filters appear automatically
   - New recipes matching criteria are added
   - Recipes no longer matching are removed

3. **System Smart Collections**
   - Pre-built collections:
     - Quick Meals (< 30 min)
     - Easy Recipes (difficulty: Easy)
     - Recent Additions (last 7 days)
   - Cannot modify system collection filters

#### Creating Smart Collections
1. Navigate to Collections page
2. Click "New Smart Collection"
3. Configure filter rules
4. Preview matching recipes
5. Save collection

---

### Saved Posts Page (Instagram Integration)

**Route: `/saved-posts`**

Manage and import recipes from Instagram saved posts.

#### Prerequisites
- Install the GramGrab Chrome Extension
- Connect your Instagram account via the extension

#### Interface Overview

**Status Filters**
- **Pending**: New posts awaiting action
- **In Progress**: Posts being processed
- **Imported**: Successfully imported as recipes
- **Dismissed**: Posts you've hidden

**Search & Filter**
- Search captions for keywords
- Filter by Instagram account
- Filter by Instagram collection
- Sort by date, likes, comments

**View Options**
- Grid or list view
- Thumbnail size options

#### Post Actions

**Single Post Actions**
1. **Preview Caption**
   - Click on post to open caption modal
   - Full caption text displayed
   - Navigate between posts with arrows

2. **Parse with AI**
   - Extracts recipe from caption
   - Identifies ingredients and steps
   - Prepares post for import

3. **Translate**
   - Translates caption to English
   - Useful for foreign language posts

4. **Generate Steps**
   - AI creates cooking instructions from ingredients
   - For posts that only list ingredients

5. **Import**
   - Opens import dialog
   - Review extracted recipe data
   - Edit before saving
   - Creates recipe in your library

6. **Dismiss**
   - Hides post from pending list
   - Can be restored later

**Bulk Actions**
- Select multiple posts with checkboxes
- Bulk import to queue
- Bulk dismiss
- Progress modal shows import status

#### Reload Images
- Instagram CDN links expire after time
- Click "Reload via Extension" to refresh
- Requires extension to be active

---

### Shared Recipes Page

**Route: `/shared`**

Manage recipes shared with you and by you.

#### Tabs

**1. Shared With Me**
- Recipes others have shared with you
- Shows who shared and when
- Permission level (view, edit, reshare)
- Expiration date if set
- Mark as viewed

**2. Shared By Me**
- Recipes you've shared with others
- See who has access
- Modify permissions
- Revoke access

#### Viewing Shared Recipes
- Click to view full recipe
- If you have edit permission, can modify
- Can add personal notes

---

### Settings Page

**Route: `/settings`**

Manage your account and preferences.

#### Tabs

**1. Profile**
- Update display name
- Change email address
- Upload/change avatar
- View account creation date

**2. Preferences**
- **Default Servings**: Set default serving size for recipes
- **Measurement Units**: Metric or Imperial
- **Theme**: Light or Dark mode
- **Language**: English or Arabic

**3. Notifications**
- Email notification toggles:
  - Recipe shares
  - Collection shares
  - Comments on shared recipes
  - Weekly digest
  - Product updates

**4. Security**
- Change password
- View active sessions
- Delete account (with confirmation)

---

## Key Features

### Recipe Translation

Translate recipes between English and Arabic.

#### How to Translate

1. Open a recipe detail page
2. Click the "Translate" button in the header
3. Wait for AI translation (few seconds)
4. View translated version
5. Switch between original and translated

#### What Gets Translated
- Recipe title
- Description
- Ingredient names
- Step instructions
- Notes and tips

#### Translation Storage
- Translations are saved to database
- Access translated versions anytime
- No need to re-translate

---

### Serving Size Adjuster

Dynamically adjust ingredient quantities.

#### How to Use

1. Open recipe detail page
2. Find serving size in Overview or Ingredients tab
3. Use +/- buttons to adjust servings
4. Ingredient quantities update automatically

#### Features
- Proportional scaling of all ingredients
- Handles fractions intelligently
- Reset to original serving size button

---

### Sharing Recipes

Share recipes and collections with other users.

#### Sharing a Recipe

1. Open recipe detail page
2. Click "Share" button
3. Search for user by email
4. Set permissions:
   - **View**: Can only view recipe
   - **Edit**: Can modify recipe
   - **Reshare**: Can share with others
5. Optional: Set expiration date
6. Click "Share"

#### Alternative Sharing
- **Copy Link**: Get shareable link
- **WhatsApp**: Share via WhatsApp
- **Twitter**: Post to Twitter
- **Facebook**: Share on Facebook
- **Email**: Send via email

#### Managing Shares
- View all shares in "Shared Recipes" page
- Modify permissions anytime
- Revoke access when needed

---

### Chrome Extension for Instagram

Sync your Instagram saved posts to GramGrab.

#### Installation

1. Navigate to Settings or Saved Posts page
2. Click "Download Extension" or similar link
3. Unzip the downloaded file
4. Open Chrome and go to `chrome://extensions`
5. Enable "Developer mode"
6. Click "Load unpacked"
7. Select the extension folder

#### Using the Extension

1. **Login to Instagram**
   - Ensure you're logged into Instagram in Chrome

2. **Open Extension**
   - Click GramGrab icon in Chrome toolbar

3. **Sync Posts**
   - Click "Sync Saved Posts"
   - Extension fetches your saved posts
   - Posts appear in GramGrab Saved Posts page

4. **Reload Images**
   - When images expire, use extension to reload
   - Click "Reload Images" in extension popup

#### Troubleshooting
- Ensure you're logged into Instagram
- Check that extension has permissions
- Try removing and re-adding extension
- Contact support if issues persist

---

## Coming Soon

### Meal Planner
**Route: `/meal-planner`**

- Plan meals for the week
- Drag recipes to calendar
- Generate shopping lists from meal plans
- Nutritional summary for meal plans

### Shopping List
**Route: `/shopping-list`**

- Generate lists from recipes
- Combine ingredients from multiple recipes
- Check off items while shopping
- Share lists with family

---

## Tips & Best Practices

### Importing Recipes
1. For best results with text parsing, include clear ingredient lists
2. URL import works best with major recipe sites
3. Image import handles both printed and handwritten recipes
4. Always review parsed data before saving

### Organizing Recipes
1. Use tags consistently for better filtering
2. Create collections for meal types or occasions
3. Use smart collections for automatic organization
4. Favorite frequently used recipes

### Instagram Import
1. Sync regularly to keep posts updated
2. Dismiss non-recipe posts to keep list clean
3. Use bulk import for efficiency
4. Parse and translate before importing for best results

### Sharing
1. Use "View" permission for casual sharing
2. Use "Edit" permission for collaborative recipes
3. Set expiration for temporary shares
4. Use social sharing for public recipes

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Search recipes | `Ctrl/Cmd + K` |
| New recipe | `Ctrl/Cmd + N` |
| Save changes | `Ctrl/Cmd + S` |
| Close modal | `Escape` |

---

## Support

For help and feedback:
- Report issues at the project repository
- Contact support through Settings page
- Check FAQ in Help section

---

*Last updated: December 2024*
