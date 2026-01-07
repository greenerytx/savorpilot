# GramGrab Implementation Document

## Overview

GramGrab is a full-featured recipe management application with AI-powered recipe extraction, social sharing, and multi-device support. This document tracks the technical implementation details of the migration from .NET/Angular to Node.js/React.

---

## Technology Stack

### Backend

| Component | Technology | Status |
|-----------|------------|--------|
| Runtime | Node.js 20 LTS | Configured |
| Framework | NestJS | Implemented |
| Language | TypeScript | Configured |
| ORM | Prisma | Implemented |
| Database | PostgreSQL | Schema Complete |
| Auth | JWT + Refresh Tokens | Implemented |
| Validation | class-validator | Pending |
| API Docs | Swagger (@nestjs/swagger) | Pending |
| Testing | Jest | Configured |

### Frontend

| Component | Technology | Status |
|-----------|------------|--------|
| Framework | React 18 | Implemented |
| Build Tool | Vite | Configured |
| Language | TypeScript | Configured |
| Styling | Tailwind CSS | Implemented |
| State | Zustand | Implemented |
| Data Fetching | TanStack Query | Configured |
| Routing | React Router v6 | Implemented |
| Forms | React Hook Form + Zod | Pending |

---

## Project Structure

### Backend (`/backend`)

```
backend/
├── prisma/
│   └── schema.prisma          # Complete database schema (616 lines)
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.ts # Login, register, refresh, logout
│   │   ├── auth.service.ts    # JWT + bcrypt + refresh rotation
│   │   ├── auth.module.ts     # Module configuration
│   │   ├── decorators/        # @Public, @CurrentUser
│   │   ├── dto/               # LoginDto, AuthResponseDto
│   │   ├── guards/            # JwtAuthGuard
│   │   └── strategies/        # JWT strategy
│   ├── prisma/                # Database service
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts          # Root module
│   ├── app.controller.ts      # Health check
│   ├── app.service.ts         # App service
│   └── main.ts                # Bootstrap
├── .env                       # Environment variables
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx    # App shell with sidebar
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   └── index.ts
│   │   ├── recipes/
│   │   │   └── RecipeCard.tsx    # Recipe card component
│   │   └── ui/
│   │       ├── Badge.tsx         # Badge component
│   │       ├── Button.tsx        # Button variants
│   │       ├── Card.tsx          # Card component
│   │       ├── Input.tsx         # Form input
│   │       └── index.ts
│   ├── lib/
│   │   └── utils.ts              # Utility functions (cn)
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx     # Login/register page
│   │   ├── recipes/
│   │   │   └── RecipeListPage.tsx # Recipe list with filters
│   │   └── HomePage.tsx          # Dashboard home
│   ├── services/
│   │   ├── api.ts                # Axios API client
│   │   └── auth.service.ts       # Auth API calls
│   ├── stores/
│   │   └── authStore.ts          # Zustand auth state
│   ├── types/
│   │   └── auth.ts               # Auth type definitions
│   ├── App.tsx                   # Routes + providers
│   └── main.tsx                  # Entry point
├── tailwind.config.js            # Custom design system
├── .env                          # API URL config
└── package.json                  # Dependencies
```

---

## Database Schema

### Core Models (25+ entities)

#### User Management
- **User** - Core user entity with preferences
- **RefreshToken** - JWT refresh token rotation
- **UserDevice** - Multi-device management
- **UserLinkCode** - Device linking codes
- **UserDietaryRestriction** - User dietary preferences
- **UserAllergen** - User allergen tracking

#### Recipe Management
- **Recipe** - Core recipe entity with JSON components
- **RecipeNotes** - Personal and shared notes
- **RecipeNutrition** - Nutritional information
- **RecipeVersion** - Version history tracking

#### Recipe Metadata (Many-to-Many)
- **Equipment** / **RecipeEquipment**
- **Allergen** / **RecipeAllergen**
- **DietPlan** / **RecipeDietPlan**
- **CookingMethod** / **RecipeCookingMethod**

#### Social Features
- **RecipeGroup** - Recipe collections
- **RecipeGroupMembership** - Recipe-to-group mapping
- **SharedRecipe** - Recipe sharing
- **SharedRecipeGroup** - Group sharing

#### Engagement
- **RecipeRating** - User ratings and reviews
- **CookLog** - Cooking history tracking

#### Planning (New Features)
- **MealPlan** / **MealPlanEntry**
- **ShoppingList** / **ShoppingListItem**

### Enums

```prisma
enum UserStatus { ACTIVE, INACTIVE, PENDING }
enum UserRole { USER, ADMIN }
enum RecipeSource { TEXT, IMAGE, INSTAGRAM_URL, INSTAGRAM_SHARE, URL, GENERATED, OTHER }
enum RecipeDifficulty { EASY, MEDIUM, HARD, EXPERT }
enum RecipeCategory { BREAKFAST, BRUNCH, LUNCH, DINNER, ... (23 total) }
```

---

## Authentication System

### Flow Overview

```
1. Login/Register
   └─> Generate Access Token (15min) + Refresh Token (7d)
   └─> Store refresh token in DB with family ID
   └─> Return tokens + user info

2. Protected Routes
   └─> Verify access token via JwtAuthGuard
   └─> Extract user from @CurrentUser decorator

3. Token Refresh
   └─> Verify refresh token
   └─> Check not revoked in DB
   └─> Rotate: revoke old, issue new
   └─> Same family for tracking

4. Logout
   └─> Revoke entire token family (security)
```

### Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Token Rotation**: Refresh tokens are single-use
- **Family Tracking**: Detect token reuse attacks
- **Automatic Revocation**: Revoke family on suspicious activity

---

## Frontend Architecture

### Routing Structure

```typescript
/                    → HomePage (Dashboard)
/login               → LoginPage
/register            → RegisterPage (TODO)
/recipes             → RecipeListPage
/recipes/:id         → RecipeDetailPage (TODO)
/recipes/new         → RecipeSubmissionPage (TODO)
/collections         → CollectionsPage (TODO)
/shared              → SharedRecipesPage (TODO)
/meal-planner        → MealPlannerPage (TODO)
/shopping-list       → ShoppingListPage (TODO)
/generate            → GenerateRecipePage (TODO)
/settings            → SettingsPage (TODO)
```

### State Management

```typescript
// Auth Store (Zustand)
useAuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email, password)
  register(...)
  logout()
  fetchCurrentUser()
}
```

### Component Architecture

```
MainLayout
├── Sidebar (fixed left)
│   ├── Logo
│   ├── Add Recipe Button
│   ├── Generate Recipe Button
│   ├── Navigation Links
│   └── User Section
└── Outlet (page content)
    └── Page Components
```

---

## Design System

### Color Palette (Tailwind)

```javascript
colors: {
  primary: {
    50: '#fef7f0',    // Warm cream tint
    500: '#e86c4f',   // Coral/terracotta
    600: '#d45a3d',   // Darker coral
    700: '#c04830',   // Deep coral
  },
  cream: {
    50: '#fdfbf7',    // Background
    100: '#faf6ef',   // Cards
  },
  neutral: {
    // Standard gray scale
  }
}
```

### UI Components

| Component | Variants | Status |
|-----------|----------|--------|
| Button | default, secondary, outline, ghost, destructive | Complete |
| Card | default | Complete |
| Badge | default, secondary, outline + colors | Complete |
| Input | default | Complete |
| RecipeCard | - | Complete |

---

## API Endpoints (Planned)

### Authentication

| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/auth/login` | Implemented |
| POST | `/api/auth/register` | Implemented |
| POST | `/api/auth/refresh` | Implemented |
| POST | `/api/auth/logout` | Implemented |
| GET | `/api/auth/me` | Pending |

### Recipes

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/recipes` | Pending |
| GET | `/api/recipes/:id` | Pending |
| POST | `/api/recipes` | Pending |
| PUT | `/api/recipes/:id` | Pending |
| DELETE | `/api/recipes/:id` | Pending |
| POST | `/api/recipes/from-text` | Pending |
| POST | `/api/recipes/from-image` | Pending |
| POST | `/api/recipes/from-instagram` | Pending |
| POST | `/api/recipes/generate` | Pending |

### Groups

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/groups` | Pending |
| POST | `/api/groups` | Pending |
| PUT | `/api/groups/:id` | Pending |
| DELETE | `/api/groups/:id` | Pending |
| POST | `/api/groups/:id/recipes` | Pending |

### Sharing

| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/sharing/recipes` | Pending |
| POST | `/api/sharing/groups` | Pending |
| GET | `/api/sharing/received` | Pending |
| GET | `/api/sharing/sent` | Pending |

### Meal Planning

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/meal-plans` | Pending |
| POST | `/api/meal-plans` | Pending |
| POST | `/api/meal-plans/:id/generate-shopping-list` | Pending |

---

## External Integrations

### OpenAI (AI Features)

- Recipe parsing from text
- Recipe extraction from images (OCR + AI)
- Recipe generation from ingredients
- Nutrition estimation

**Status**: Not yet implemented

### Firebase (Push Notifications)

- Device registration
- Push notification delivery
- Cross-device sync notifications

**Status**: Not yet implemented

### Instagram Scraping

- Extract recipes from Instagram posts
- Support for direct URLs and share links
- Caption parsing

**Status**: Not yet implemented

---

## Environment Configuration

### Backend (.env)

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
OPENAI_API_KEY=...
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Testing Strategy

### Backend

- **Unit Tests**: Service methods with mocked Prisma
- **Integration Tests**: API endpoints with test database
- **E2E Tests**: Full user flows

### Frontend

- **Component Tests**: Vitest + React Testing Library
- **Integration Tests**: Page-level testing
- **E2E Tests**: Playwright (future)

---

## Deployment (Planned)

### Backend
- Docker containerization
- PostgreSQL managed database
- Redis for caching (optional)

### Frontend
- Static hosting (Vercel/Netlify)
- CDN for assets

---

*Last Updated: December 21, 2024*
