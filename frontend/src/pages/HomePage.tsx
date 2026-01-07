import { Link } from 'react-router-dom';
import {
  Plus,
  Zap,
  Flame,
  Globe2,
  Shield,
  Clock,
  Heart,
  FlaskConical,
  ChefHat,
  Users,
  Calendar,
  ShoppingCart,
} from 'lucide-react';
import { Button, EmptyState } from '../components/ui';
import { SocialFeed } from '../components/social-feed';
import { getImageUrl } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { useRecipeStatistics, useRecipes, useFlavorProfile } from '../hooks';
import { useCircles } from '../hooks/useDinnerCircles';
import { useActiveChallenge } from '../hooks/useChallenges';
import { useShoppingLists } from '../hooks/useShoppingLists';

export function HomePage() {
  const { user } = useAuthStore();
  const greeting = getGreeting();

  // Hooks for real data
  const { data: statsData } = useRecipeStatistics();
  const { data: recipesData } = useRecipes({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: circlesData } = useCircles();
  const { data: flavorProfile } = useFlavorProfile();

  // Active challenge
  const { data: activeChallenge } = useActiveChallenge();

  // Shopping lists
  const { data: shoppingListsData } = useShoppingLists();
  const shoppingItemCount = shoppingListsData?.data?.reduce((total, list) =>
    total + (list.items?.filter(item => !item.isChecked)?.length || 0), 0) || 0;

  // Process recipes for display
  const recentRecipes = (recipesData?.data || []).map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.imageUrl,
    prepTime: r.prepTimeMinutes,
    cookTime: r.cookTimeMinutes,
    totalTime: (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0),
    servings: r.servings,
    difficulty: r.difficulty,
    category: r.category,
    cuisine: r.cuisine,
    forkCount: r.forkCount,
    isPublic: r.isPublic,
    author: user?.firstName || 'You',
  }));

  // Stats
  const stats = statsData;
  const cuisineCount = stats?.topCuisines?.length || 0;

  // Calculate level
  const totalRecipes = stats?.totalRecipes || 0;
  const level = Math.min(Math.floor(totalRecipes / 5) + 1, 10);
  const levelTitle = level <= 2 ? 'Beginner'
    : level <= 4 ? 'Home Cook'
    : level <= 6 ? 'Home Chef'
    : level <= 8 ? 'Skilled Chef'
    : 'Master Chef';

  // Flavor profile
  const flavorData = {
    heat: Math.round((flavorProfile?.heatPreference || 0.5) * 10),
    herbs: Math.round((flavorProfile?.umamiPreference || 0.6) * 10),
    umami: Math.round((flavorProfile?.umamiPreference || 0.5) * 10),
    sweet: Math.round((flavorProfile?.sweetPreference || 0.4) * 10),
    acid: Math.round((flavorProfile?.acidPreference || 0.5) * 10),
    dataPoints: flavorProfile?.dataPoints || 0,
  };

  // Dinner Circles
  const circles = (circlesData || []).slice(0, 3).map((c, i) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    status: `${c.memberCount || 0} members`,
    color: i === 0 ? 'bg-coral-100 text-coral-700' : i === 1 ? 'bg-mint-100 text-mint-700' : 'bg-blue-100 text-blue-700',
  }));

  return (
    <div className="space-y-8">
      {/* === HERO SECTION === */}
      <div className="bg-white -mx-4 sm:-mx-6 -mt-4 px-4 sm:px-6 pt-8 pb-10 border-b border-primary-100 mb-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-900">
                  Good {greeting}, {user?.firstName || 'Chef'}.
                </h1>
                <p className="text-primary-600 mt-1 text-lg">
                  {recentRecipes.length > 0 ? (
                    <>
                      Recent: <Link to={`/recipes/${recentRecipes[0]?.id}`} className="font-bold text-primary-900 border-b-2 border-coral-200 hover:text-coral-600 hover:border-coral-400 transition-colors">{recentRecipes[0]?.title}</Link>
                    </>
                  ) : (
                    "Ready to start cooking?"
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Link to="/recipes/new?source=image">
                  <button className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-900/10 hover:translate-y-[-1px] transition-all">
                    <ChefHat className="w-4 h-4" /> Start Cooking
                  </button>
                </Link>
                <Link to="/shopping-list">
                  <button className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
                    <ShoppingCart className="w-4 h-4 text-coral-500" /> Shopping List
                  </button>
                </Link>
              </div>
            </div>

            {/* Mini Dashboard Widgets */}
            <div className="hidden md:flex gap-4">
              <div className="bg-primary-50 p-4 rounded-xl border border-primary-100/50 min-w-[140px]">
                <p className="text-xs font-bold text-primary-400 uppercase">Recipes</p>
                <p className="text-2xl font-bold text-primary-900 mt-1">{totalRecipes}</p>
                <p className="text-xs text-primary-500">in your collection</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100/50 min-w-[140px]">
                <p className="text-xs font-bold text-orange-400 uppercase">Level {level}</p>
                <p className="text-lg font-bold text-orange-900 mt-1">{levelTitle}</p>
                <p className="text-xs text-orange-600">{cuisineCount} cuisines explored</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === RECIPE CARDS SECTION === */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">Your Recipes</h2>
            <p className="text-primary-500 text-sm mt-1">Recently added and favorites</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/recipes" className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors">
              View All
            </Link>
            <Link to="/recipes/new?source=image">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors">
                <Plus className="w-4 h-4" /> Add Recipe
              </button>
            </Link>
          </div>
        </div>

        {recentRecipes.length === 0 ? (
          <div className="card-warm p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <ChefHat className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-primary-900">No recipes yet</h3>
                <p className="text-sm text-primary-500">Start your collection</p>
              </div>
              <Link to="/recipes/new?source=image">
                <button className="px-3 py-1.5 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 transition-colors whitespace-nowrap">
                  Add Recipe
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentRecipes.slice(0, 4).map((recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
                <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-primary-100 hover:shadow-lg hover:border-coral-200 transition-all cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    {recipe.imageUrl ? (
                      <img src={getImageUrl(recipe.imageUrl)} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <ChefHat className="w-10 h-10 text-primary-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {recipe.cuisine && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-semibold rounded-full shadow-sm">{recipe.cuisine}</span>
                      </div>
                    )}
                    <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-primary-400 hover:text-coral-500 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-primary-900 group-hover:text-coral-600 transition-colors truncate">{recipe.title}</h3>
                    <p className="text-sm text-primary-500 mt-1">{recipe.author}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary-50">
                      <div className="flex items-center gap-2 text-xs text-primary-400">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.totalTime}m</span>
                        {recipe.difficulty && (
                          <span className="px-2 py-0.5 bg-primary-50 rounded font-medium capitalize">{recipe.difficulty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* === MAIN CONTENT (3-column layout) === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-primary-100">

        {/* LEFT SIDEBAR */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-2">
            {[
              { icon: Heart, label: 'Favorites', count: totalRecipes, href: '/recipes?filter=favorites' },
              { icon: Calendar, label: 'Meal Plan', count: 'Week', href: '/meal-planner' },
              { icon: ShoppingCart, label: 'Shopping', count: shoppingItemCount, href: '/shopping-list' },
              { icon: Users, label: 'Circles', count: circles.length, href: '/circles' },
            ].map((item) => (
              <Link key={item.label} to={item.href}>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-primary-400 group-hover:text-coral-500 transition-colors" />
                    <span className="font-semibold text-primary-700">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold bg-primary-100 text-primary-600 px-2 py-1 rounded-md">{item.count}</span>
                </button>
              </Link>
            ))}
          </div>

          {/* Flavor DNA Preview */}
          <Link to="/flavor-dna" className="block mt-2">
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-coral-500" />
                <h3 className="font-bold text-sm text-primary-900">Your Flavor DNA</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Heat', value: flavorData.heat, color: 'bg-coral-500' },
                  { label: 'Umami', value: flavorData.umami, color: 'bg-primary-600' },
                  { label: 'Sweet', value: flavorData.sweet, color: 'bg-amber-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-xs text-primary-500 w-12">{item.label}</span>
                    <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value * 10}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-400 mt-3">{flavorData.dataPoints} dishes analyzed</p>
            </div>
          </Link>
        </div>

        {/* CENTER - Social Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Social Feed */}
          <SocialFeed showComposer={true} limit={10} />

          {/* Your Circles */}
          {circles.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-primary-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-coral-500" />
                  Your Circles
                </h3>
                <Link to="/circles" className="text-xs text-coral-600 font-medium hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {circles.map((circle) => (
                  <Link key={circle.id} to={`/circles/${circle.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors">
                      <div className={`w-10 h-10 rounded-full ${circle.color} flex items-center justify-center text-lg`}>
                        {circle.emoji || circle.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-primary-900 truncate">{circle.name}</p>
                        <p className="text-xs text-primary-500">{circle.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link to="/circles">
                  <button className="w-full flex items-center justify-center gap-2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> Create Circle
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {/* AI Suggestion Card */}
          <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-white/80">AI Suggestion</span>
            </div>
            <p className="text-sm text-white/90 mb-4">
              Based on your flavor profile, try something new today!
            </p>
            <Link to="/generate">
              <button className="w-full bg-coral-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-coral-600 transition-colors">
                Generate Recipe
              </button>
            </Link>
          </div>

          {/* Weekly Challenge */}
          {activeChallenge ? (
            <div className="bg-gradient-to-br from-coral-500 to-terracotta-600 rounded-2xl p-5 text-white shadow-lg shadow-coral-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Weekly Challenge</h3>
              </div>
              <h4 className="text-xl font-display font-bold mb-2">{activeChallenge.title}</h4>
              <p className="text-sm text-white/90 mb-4 leading-snug">{activeChallenge.description}</p>
              <Link to={`/challenges/${activeChallenge.id}`}>
                <button className="w-full bg-white text-coral-600 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors shadow-sm">
                  Join Challenge
                </button>
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-coral-500 to-terracotta-600 rounded-2xl p-5 text-white shadow-lg shadow-coral-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Challenges</h3>
              </div>
              <h4 className="text-xl font-display font-bold mb-2">Join a Challenge</h4>
              <p className="text-sm text-white/90 mb-4 leading-snug">Compete with others and showcase your skills!</p>
              <Link to="/challenges">
                <button className="w-full bg-white text-coral-600 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors shadow-sm">
                  Browse Challenges
                </button>
              </Link>
            </div>
          )}

          {/* Explore More */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-5">
            <h3 className="font-bold text-sm uppercase text-primary-400 mb-4">Explore More</h3>
            <div className="space-y-2">
              {[
                { label: 'Fusion Lab', href: '/fusion-lab', icon: FlaskConical },
                { label: 'Explore Recipes', href: '/explore', icon: Globe2 },
                { label: 'Nutrition', href: '/nutrition', icon: Shield },
              ].map((item) => (
                <Link key={item.label} to={item.href}>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors text-left group">
                    <item.icon className="w-5 h-5 text-primary-400 group-hover:text-coral-500 transition-colors" />
                    <span className="font-medium text-primary-700 group-hover:text-primary-900">{item.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
