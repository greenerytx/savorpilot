import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from './lib/queryClient';

// Layouts
import { MainLayout } from './components/layout';

// UI Providers
import { ToastProvider, ConfirmProvider } from './components/ui';

// Context Providers
import { BackgroundJobsProvider } from './contexts/BackgroundJobsContext';

// Pages
import { LoginPage, RegisterPage } from './pages/auth';
import { HomePage } from './pages/HomePage';
import { RecipeListPage, RecipeDetailPage, RecipeSubmissionPage, RecipeEditPage, RecipeGeneratePage, CookModePage } from './pages/recipes';
import { CollectionsPage, CollectionDetailPage, CollectionEditPage, SmartCollectionDetailPage } from './pages/collections';
import { SharedRecipesPage } from './pages/shared';
import { SettingsPage } from './pages/settings';
import { SavedPostsPage } from './pages/instagram';
import { YouTubeExtractPage } from './pages/youtube';
import { DinnerCirclesPage } from './pages/circles';
import { MealPlannerPage } from './pages/meal-planning/MealPlannerPage';
import { ShoppingListPage } from './pages/shopping/ShoppingListPage';
import { NutritionDashboardPage } from './pages/nutrition';
import { PartyEventsPage, PartyEventDetailPage } from './pages/party-events';
import { ProfilePage } from './pages/social/ProfilePage';
import { ActivityFeedPage } from './pages/social/ActivityFeedPage';
import { ExplorePage } from './pages/explore/ExplorePage';
import ChallengesPage from './pages/challenges/ChallengesPage';
import ChallengeDetailPage from './pages/challenges/ChallengeDetailPage';
import { PublicRecipePage } from './pages/public';
import { FusionLabPage } from './pages/fusion/FusionLabPage';
import { HeaderShowcasePage } from './pages/design/HeaderShowcasePage';
import { LandingShowcasePage } from './pages/design/LandingShowcasePage';
import { HybridShowcasePage } from './pages/design/HybridShowcasePage';
import { RecipeDetailShowcasePage } from './pages/design/recipe-detail/RecipeDetailShowcasePage';

// Store
import { useAuthStore } from './stores/authStore';

// Services
import { authService } from './services/auth.service';

// DEMO MODE - Set to false when backend is ready
const DEMO_MODE = false;

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchCurrentUser, setUser } = useAuthStore();

  useEffect(() => {
    // Sync auth cookie for Chrome extension access
    authService.syncCookie();

    if (DEMO_MODE) {
      // Set demo user for UI preview
      setUser({
        id: 'demo-user',
        email: 'demo@gramgrab.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date().toISOString(),
      });
    } else {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser, setUser]);

  if (!DEMO_MODE && isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!DEMO_MODE && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (DEMO_MODE || isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BackgroundJobsProvider>
          <ConfirmProvider>
            <BrowserRouter>
            <Routes>
            {/* Public Recipe Page (no auth required) */}
            <Route path="/r/:id" element={<PublicRecipePage />} />
            
            {/* Design Showcase */}
            <Route path="/design/headers" element={<HeaderShowcasePage />} />
            <Route path="/design/landing" element={<LandingShowcasePage />} />
            <Route path="/design/hybrid" element={<HybridShowcasePage />} />
            <Route path="/design/recipe-detail" element={<RecipeDetailShowcasePage />} />

            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

          {/* Full-screen Cook Mode (no MainLayout) */}
          <Route
            path="/recipes/:id/cook"
            element={
              <ProtectedRoute>
                <CookModePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="recipes" element={<RecipeListPage />} />
            <Route path="recipes/new" element={<RecipeSubmissionPage />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="recipes/:id/edit" element={<RecipeEditPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="collections/:id" element={<CollectionDetailPage />} />
            <Route path="collections/:id/edit" element={<CollectionEditPage />} />
            <Route path="collections/smart/:id" element={<SmartCollectionDetailPage />} />
            <Route path="shared" element={<SharedRecipesPage />} />
            <Route path="meal-planner" element={<MealPlannerPage />} />
            <Route path="nutrition" element={<NutritionDashboardPage />} />
            <Route path="shopping-list" element={<ShoppingListPage />} />
            <Route path="generate" element={<RecipeGeneratePage />} />
            <Route path="saved-posts" element={<SavedPostsPage />} />
            <Route path="youtube" element={<YouTubeExtractPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="circles" element={<DinnerCirclesPage />} />
            <Route path="events" element={<PartyEventsPage />} />
            <Route path="events/:id" element={<PartyEventDetailPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="feed" element={<ActivityFeedPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="challenges" element={<ChallengesPage />} />
            <Route path="challenges/:id" element={<ChallengeDetailPage />} />
            <Route path="fusion-lab" element={<FusionLabPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </BrowserRouter>
          </ConfirmProvider>
        </BackgroundJobsProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
