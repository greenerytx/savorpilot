import {
  ChefHat,
  ShoppingCart,
  Zap,
  Plus,
  Heart,
  Flame,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  MessageCircle,
  Share2,
  Sparkles,
  Clock,
  Users,
} from 'lucide-react';

// Mock Data
const MOCK_USER = { firstName: 'Mohammed', lastName: 'Hammoud' };
const MOCK_RECIPES = [
  { id: 1, title: 'Spicy Tuscan Shrimp', author: 'Chef Bella', time: '25m', likes: 1240, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80' },
  { id: 2, title: 'Golden Milk Latte', author: 'Wellness Co', time: '5m', likes: 850, image: 'https://images.unsplash.com/photo-1515516901840-058a705146c0?auto=format&fit=crop&q=80' },
  { id: 3, title: 'Avocado Toast Deluxe', author: 'Brunch Master', time: '10m', likes: 3200, image: 'https://images.unsplash.com/photo-1541519227354-08fa5d625a87?auto=format&fit=crop&q=80' },
  { id: 4, title: 'Mediterranean Bowl', author: 'Healthy Eats', time: '15m', likes: 2100, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80' },
];

const MOCK_CIRCLES = [
  { name: 'Family Potluck', status: 'Event on Sat', color: 'bg-coral-100 text-coral-700', members: 8 },
  { name: 'Keto Crew', status: '3 new recipes', color: 'bg-green-100 text-green-700', members: 24 },
  { name: 'Office Lunch', status: 'Planning...', color: 'bg-blue-100 text-blue-700', members: 12 },
];

const MOCK_FEED = [
  {
    id: 1,
    user: { name: 'Jessica Chen', avatar: 'https://i.pravatar.cc/150?u=jess' },
    time: '2 hours ago',
    action: 'Forked your recipe',
    content: 'Made this for the family tonight but swapped the heavy cream for coconut milk. Absolute game changer! 🥥🔥',
    recipe: MOCK_RECIPES[0],
    likes: 24,
    comments: 8,
  },
  {
    id: 2,
    user: { name: 'Tom Baker', avatar: 'https://i.pravatar.cc/150?u=tom' },
    time: '5 hours ago',
    action: null,
    content: 'Does anyone have a reliable gluten-free pizza dough recipe? The last 3 I tried were like cardboard. 😩',
    recipe: null,
    likes: 5,
    comments: 12,
  },
];

const TRENDING_TAGS = ['#MeatlessMonday', '#QuickDinner', '#Sourdough', '#SpicyChallenge'];

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function LandingHybridPage() {
  const timeOfDay = getTimeOfDay();

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-primary-900 text-white py-12 px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Hybrid Landing Design</h1>
          <p className="text-primary-200 text-lg">
            Combining the utility-first approach of Variation A with the social engagement of Variation B.
          </p>
        </div>
      </div>

      {/* Landing Page Preview */}
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xl bg-cream-50">

          {/* === HERO SECTION (from A) === */}
          <div className="bg-white border-b border-primary-100">
            {/* Contextual Header Strip */}
            <div className="bg-gradient-to-r from-primary-900 to-primary-800 px-6 py-3">
              <div className="max-w-5xl mx-auto flex justify-between items-center text-white/90 text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Monday Evening
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Dinner time
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>72°F</span>
                  <span>🌤️</span>
                  <span className="hidden sm:inline text-white/60">Perfect for grilling</span>
                </div>
              </div>
            </div>

            {/* Main Hero */}
            <div className="px-6 py-8">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                  <div>
                    <p className="text-coral-500 font-bold text-sm uppercase tracking-wider mb-2">
                      Welcome back
                    </p>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-900 mb-3">
                      Good {timeOfDay}, {MOCK_USER.firstName}.
                    </h1>
                    <p className="text-primary-500 text-lg">
                      You have{' '}
                      <span className="font-semibold text-primary-800 border-b-2 border-coral-300 cursor-pointer hover:text-coral-600 transition-colors">
                        Lemon Herb Chicken
                      </span>{' '}
                      planned for dinner.
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-full font-semibold whitespace-nowrap shadow-lg shadow-primary-900/20 hover:bg-primary-800 hover:scale-105 transition-all">
                      <ChefHat className="w-4 h-4" /> Start Cooking
                    </button>
                    <button className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-full font-semibold whitespace-nowrap hover:bg-primary-50 hover:border-primary-300 transition-colors">
                      <ShoppingCart className="w-4 h-4 text-coral-500" /> Shop (4)
                    </button>
                    <button className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-full font-semibold whitespace-nowrap hover:bg-primary-50 hover:border-primary-300 transition-colors">
                      <Zap className="w-4 h-4 text-yellow-500" /> AI Suggest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === MAIN CONTENT AREA === */}
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* === LEFT COLUMN: Social Feed (from B) === */}
              <div className="lg:col-span-2 space-y-6">

                {/* Post Composer */}
                <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-4 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    MH
                  </div>
                  <div className="flex-1 bg-primary-50 rounded-full px-4 py-2.5 text-primary-400 text-sm cursor-pointer hover:bg-primary-100 transition-colors">
                    Cooked something tasty? Share it...
                  </div>
                  <button className="p-2 text-coral-500 hover:bg-coral-50 rounded-full transition-colors">
                    <Flame className="w-5 h-5" />
                  </button>
                </div>

                {/* Activity Feed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg text-primary-900">Activity Feed</h2>
                    <button className="text-sm text-coral-600 font-medium hover:underline">View All</button>
                  </div>

                  {MOCK_FEED.map((post) => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-primary-100 overflow-hidden">
                      {/* Post Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-bold text-primary-900">{post.user.name}</p>
                            <p className="text-xs text-primary-500">
                              {post.time}
                              {post.action && (
                                <span className="text-coral-500 font-medium"> • {post.action}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button className="text-primary-400 hover:text-primary-600 p-1 rounded hover:bg-primary-50 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="px-4 pb-3">
                        <p className="text-primary-700 text-sm leading-relaxed">{post.content}</p>
                      </div>

                      {/* Recipe Image (if any) */}
                      {post.recipe && (
                        <div className="relative aspect-video bg-primary-100">
                          <img src={post.recipe.image} className="w-full h-full object-cover" alt={post.recipe.title} />
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm">
                            {post.recipe.title}
                          </div>
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="p-3 border-t border-primary-100 flex items-center gap-6 text-primary-500 text-sm">
                        <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" /> {post.likes}
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-4 h-4" /> {post.comments}
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors ml-auto">
                          <Share2 className="w-4 h-4" /> Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Jump Back In - Recent Recipes (from A) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg text-primary-900">Jump Back In</h2>
                    <button className="text-sm text-coral-600 font-medium hover:underline">View All</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {MOCK_RECIPES.slice(0, 4).map((recipe) => (
                      <div key={recipe.id} className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer shadow-sm">
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <p className="font-bold text-sm truncate">{recipe.title}</p>
                          <p className="text-xs text-white/70">{recipe.time} • {recipe.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* === RIGHT COLUMN: Sidebar === */}
              <div className="space-y-6">

                {/* Your Circles (from A) */}
                <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-primary-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-coral-500" />
                      Your Circles
                    </h3>
                    <button className="text-xs text-coral-600 font-medium hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_CIRCLES.map((circle, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 cursor-pointer transition-colors">
                        <div className={`w-10 h-10 rounded-full ${circle.color} flex items-center justify-center font-bold text-sm`}>
                          {circle.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-primary-900 truncate">{circle.name}</p>
                          <p className="text-xs text-primary-500">{circle.status}</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full flex items-center justify-center gap-2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium">
                      <Plus className="w-4 h-4" /> Create Circle
                    </button>
                  </div>
                </div>

                {/* Weekly Challenge (from B) */}
                <div className="bg-gradient-to-br from-coral-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="font-bold">Weekly Challenge</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-4">"Best Burger" ends in 2 days!</p>
                  <div className="flex items-center gap-2 mb-4 text-xs text-white/70">
                    <span>🏆 247 entries</span>
                    <span>•</span>
                    <span>$50 prize</span>
                  </div>
                  <button className="w-full bg-white text-coral-600 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">
                    Join Challenge
                  </button>
                </div>

                {/* Trending Tags (from B) */}
                <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-4">
                  <h3 className="font-bold text-primary-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Trending Now
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-100 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Suggestion Card */}
                <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-xl shadow-lg p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-white/80">AI Suggestion</span>
                  </div>
                  <p className="text-sm text-white/90 mb-4">
                    Based on your flavor profile, you might enjoy making{' '}
                    <span className="font-semibold text-coral-300">Herb-Crusted Salmon</span> tonight!
                  </p>
                  <button className="w-full bg-coral-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-coral-600 transition-colors">
                    View Recipe
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
