# SavorPilot

A comprehensive recipe management and social cooking platform.

## Features

### Core Recipe Management
- AI-powered recipe extraction from URLs, YouTube videos, and Instagram posts
- Recipe forking and variations system
- Flavor DNA profiling
- Nutrition analysis

### Grocery Genius
- Kroger API integration for real-time product pricing
- Open Food Facts API for barcode scanning
- Smart aisle sorting based on store layout
- Price comparison across stores

### Social Features
- Follow cooks and get recipe recommendations
- Cooking challenges and badges
- Recipe reactions and comments
- Share cooking posts with photos

### Meal Planning
- Weekly meal planning calendar
- Smart shopping lists
- Dinner circles for group meal planning
- Party event planning with RSVP

## Tech Stack

### Backend
- NestJS with TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication
- Swagger API documentation

### Frontend
- React with TypeScript
- Vite build system
- TailwindCSS styling

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Kroger API credentials (optional, for grocery features)

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## API Documentation

Once the backend is running, visit `http://localhost:3000/api` for Swagger documentation.

## License

MIT
