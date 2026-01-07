import { useState } from 'react';
import {
  Home,
  UtensilsCrossed,
  FolderOpen,
  Settings,
  LogOut,
  ChevronDown,
  Instagram,
  Youtube,
  Calendar,
  ShoppingCart,
  Link2,
  Menu,
  Search,
  Users,
  PartyPopper,
  Compass,
  Plus,
  Sparkles,
  FlaskConical,
  BarChart3,
  Dna,
  Bell,
  ChefHat,
  Zap,
  Flame,
  Heart,
  Clock,
  MoreHorizontal,
  MessageCircle,
  Share2
} from 'lucide-react';
import { cn } from '../../lib/utils';

// --- MOCK DATA ---
const MOCK_USER = { firstName: 'Mohammed', lastName: 'Hammoud' };
const MOCK_RECIPES = [
  { id: 1, title: 'Spicy Tuscan Shrimp', author: 'Chef Bella', time: '25m', difficulty: 'Easy', likes: 1240, cuisine: 'Italian', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80' },
  { id: 2, title: 'Golden Milk Latte', author: 'Wellness Co', time: '5m', difficulty: 'Easy', likes: 850, cuisine: 'Beverage', image: 'https://images.unsplash.com/photo-1515516901840-058a705146c0?auto=format&fit=crop&q=80' },
  { id: 3, title: 'Avocado Toast Deluxe', author: 'Brunch Master', time: '10m', difficulty: 'Easy', likes: 3200, cuisine: 'American', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d625a87?auto=format&fit=crop&q=80' },
  { id: 4, title: 'Mediterranean Bowl', author: 'Healthy Eats', time: '15m', difficulty: 'Easy', likes: 2100, cuisine: 'Mediterranean', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80' },
  { id: 5, title: 'Homemade Ramen', author: 'Noodle House', time: '45m', difficulty: 'Medium', likes: 4500, cuisine: 'Japanese', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80' },
  { id: 6, title: 'Margherita Pizza', author: 'Pizza Pro', time: '30m', difficulty: 'Medium', likes: 5200, cuisine: 'Italian', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80' },
];

// --- COMPONENTS ---

const UserAvatar = () => (
  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-700 to-coral-500 flex items-center justify-center text-white font-semibold text-sm shadow-md cursor-pointer">
    MR
  </div>
);

const NotificationBadge = () => (
  <div className="relative p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors cursor-pointer">
    <Bell className="w-5 h-5" />
    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
  </div>
);

// Recipe Card Component
const RecipeCard = ({ recipe, variant = 'default' }: { recipe: typeof MOCK_RECIPES[0]; variant?: 'default' | 'compact' | 'featured' }) => {
  if (variant === 'featured') {
    return (
      <div className="group relative rounded-2xl overflow-hidden aspect-[16/10] cursor-pointer shadow-lg hover:shadow-xl transition-all">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-coral-500 text-white text-xs font-bold rounded-full">{recipe.cuisine}</span>
        </div>
        <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
          <Heart className="w-5 h-5" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h3 className="text-xl font-bold mb-2 group-hover:text-coral-300 transition-colors">{recipe.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.time}</span>
              <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{recipe.difficulty}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Heart className="w-4 h-4 fill-coral-400 text-coral-400" />
              <span>{(recipe.likes / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="group flex gap-3 p-3 bg-white rounded-xl border border-primary-100 hover:shadow-md hover:border-coral-200 transition-all cursor-pointer">
        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h4 className="font-bold text-sm text-primary-900 truncate group-hover:text-coral-600 transition-colors">{recipe.title}</h4>
          <p className="text-xs text-primary-500 mt-1">{recipe.author}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-primary-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.time}</span>
            <span className="px-1.5 py-0.5 bg-primary-50 rounded">{recipe.difficulty}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default card
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-primary-100 hover:shadow-lg hover:border-coral-200 transition-all cursor-pointer">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-semibold rounded-full shadow-sm">{recipe.cuisine}</span>
        </div>
        <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-primary-400 hover:text-coral-500 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-primary-900 group-hover:text-coral-600 transition-colors truncate">{recipe.title}</h3>
        <p className="text-sm text-primary-500 mt-1">{recipe.author}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary-50">
          <div className="flex items-center gap-2 text-xs text-primary-400">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.time}</span>
            <span className="px-2 py-0.5 bg-primary-50 rounded font-medium">{recipe.difficulty}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary-400">
            <Heart className="w-3.5 h-3.5" />
            <span>{(recipe.likes / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Header Option A (Refined)
function Header() {
  const [activeTab, setActiveTab] = useState('Home');
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-primary-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-900/10">
               <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary-900 leading-none tracking-tight">
                Savor<span className="text-coral-500">Pilot</span>
              </span>
              <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-widest mt-0.5">
                Social Cooking
              </span>
            </div>
          </div>

          {/* Nav Pills */}
          <div className="hidden lg:flex items-center bg-primary-50/80 p-1.5 rounded-2xl border border-primary-100/50">
            {[
              { name: 'Home', icon: Home },
              { name: 'Explore', icon: Compass },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  activeTab === item.name
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <item.icon className={cn("w-4 h-4", activeTab === item.name ? "text-coral-500" : "text-primary-400")} />
                {item.name}
              </button>
            ))}

            {/* Plan Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setShowPlanMenu(true)}
              onMouseLeave={() => setShowPlanMenu(false)}
            >
              <button
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  activeTab === 'Plan'
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <Calendar className={cn("w-4 h-4", activeTab === 'Plan' ? "text-coral-500" : "text-primary-400")} />
                Plan
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
              </button>

              {showPlanMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-primary-100 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                  <div className="space-y-0.5">
                    {[
                      { name: 'Meal Planner', icon: Calendar, desc: 'Weekly schedule' },
                      { name: 'Shopping List', icon: ShoppingCart, desc: 'Groceries' },
                      { name: 'Nutrition', icon: BarChart3, desc: 'Health goals' },
                      { name: 'Party Mode', icon: PartyPopper, desc: 'Events' },
                    ].map((subItem) => (
                      <button
                        key={subItem.name}
                        className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors text-left group"
                      >
                        <div className="mt-0.5 p-1.5 bg-primary-50 group-hover:bg-white rounded-md text-primary-500 group-hover:text-coral-500 transition-colors shadow-sm">
                          <subItem.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-primary-900">{subItem.name}</span>
                          <span className="block text-xs text-primary-400">{subItem.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {[
              { name: 'Recipes', icon: UtensilsCrossed },
              { name: 'Circles', icon: Users },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  activeTab === item.name
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <item.icon className={cn("w-4 h-4", activeTab === item.name ? "text-coral-500" : "text-primary-400")} />
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-1 border-r border-primary-100 pr-3 mr-1">
               <button className="p-2 text-primary-400 hover:text-coral-500 hover:bg-coral-50 rounded-full transition-all">
                 <Search className="w-5 h-5" />
               </button>
               <NotificationBadge />
             </div>

             <button className="hidden sm:flex items-center gap-2 bg-primary-900 text-white px-4 py-2.5 rounded-xl hover:bg-primary-800 transition-all shadow-lg shadow-primary-900/20 active:scale-95">
               <Plus className="w-4 h-4" />
               <span className="text-sm font-bold">Create</span>
             </button>
             
             <UserAvatar />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function HybridShowcasePage() {
  return (
    <div className="min-h-screen bg-cream-50 font-sans text-primary-900">
      <Header />

      {/* --- HERO SECTION (From Option A: Utility) --- */}
      <div className="bg-white border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-coral-500 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                   <span className="w-2 h-2 rounded-full bg-coral-500"></span> Live Status
                </p>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-900">
                  Good evening, {MOCK_USER.firstName}.
                </h1>
                <p className="text-primary-600 mt-1 text-lg">
                  Dinner Plan: <span className="font-bold text-primary-900 border-b-2 border-coral-200 cursor-pointer hover:text-coral-600 hover:border-coral-400 transition-colors">Lemon Herb Chicken</span>
                </p>
              </div>
              
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-900/10 hover:translate-y-[-1px] transition-all">
                  <ChefHat className="w-4 h-4" /> Start Cooking
                </button>
                <button className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
                  <ShoppingCart className="w-4 h-4 text-coral-500" /> Shop (4 items)
                </button>
              </div>
            </div>

            {/* Mini Dashboard Widget (Weather/Stats) */}
            <div className="hidden md:flex gap-4">
                <div className="bg-primary-50 p-4 rounded-xl border border-primary-100/50 min-w-[140px]">
                    <p className="text-xs font-bold text-primary-400 uppercase">Weekly Goal</p>
                    <p className="text-2xl font-bold text-primary-900 mt-1">3/5</p>
                    <p className="text-xs text-primary-500">Home cooked meals</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100/50 min-w-[140px]">
                    <p className="text-xs font-bold text-orange-400 uppercase">Next Event</p>
                    <p className="text-lg font-bold text-orange-900 mt-1">Sat Potluck</p>
                    <p className="text-xs text-orange-600">You need to bring dessert</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RECIPE CARDS SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">Your Recipes</h2>
            <p className="text-primary-500 text-sm mt-1">Recently viewed and favorites</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors">
              View All
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white text-sm font-semibold rounded-lg hover:bg-primary-800 transition-colors">
              <Plus className="w-4 h-4" /> Add Recipe
            </button>
          </div>
        </div>

        {/* Featured Recipe + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Large Card */}
          <div className="lg:col-span-1">
            <RecipeCard recipe={MOCK_RECIPES[5]} variant="featured" />
          </div>

          {/* Regular Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_RECIPES.slice(0, 3).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>

        </div>

      {/* --- MAIN CONTENT (Hybrid Layout) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-primary-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDEBAR - Utility (From A) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
             {/* Quick Links */}
             <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-2">
                {[
                  { icon: Heart, label: 'Favorites', count: 24 },
                  { icon: Calendar, label: 'Meal Plan', count: 'Week' },
                  { icon: ShoppingCart, label: 'Shopping', count: 4 },
                  { icon: Users, label: 'Circles', count: 3 },
                ].map((item) => (
                  <button key={item.label} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-primary-400 group-hover:text-coral-500 transition-colors" />
                      <span className="font-semibold text-primary-700">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold bg-primary-100 text-primary-600 px-2 py-1 rounded-md">{item.count}</span>
                  </button>
                ))}
             </div>

             {/* Trending Tags (From B) */}
             <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-5">
                <h3 className="font-bold text-sm uppercase text-primary-400 mb-4">Trending Now</h3>
                <div className="flex flex-wrap gap-2">
                  {['#QuickDinner', '#VeganLife', '#Sourdough', '#Spicy'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-primary-50 hover:bg-coral-50 text-primary-600 hover:text-coral-600 rounded-lg text-sm font-medium cursor-pointer transition-colors border border-transparent hover:border-coral-100">
                      {tag}
                    </span>
                  ))}
                </div>
             </div>
          </div>

          {/* CENTER FEED - Social (From B) */}
          <div className="lg:col-span-6 space-y-6">
             {/* Composer */}
             <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-4 transition-shadow hover:shadow-md">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-coral-600 flex items-center justify-center text-white font-bold shrink-0">
                    MR
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Share your culinary adventure..." 
                      className="w-full bg-primary-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-coral-500 transition-all placeholder:text-primary-400"
                    />
                    <div className="flex justify-between items-center mt-3">
                       <div className="flex gap-2">
                          <button className="p-1.5 text-primary-400 hover:text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"><MessageCircle className="w-5 h-5" /></button>
                          <button className="p-1.5 text-primary-400 hover:text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"><Link2 className="w-5 h-5" /></button>
                       </div>
                       <button className="bg-primary-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-primary-800 transition-colors">Post</button>
                    </div>
                  </div>
                </div>
             </div>

             {/* Feed Item 1 */}
             <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
                <div className="p-5 flex items-start justify-between">
                   <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden">
                         <img src="https://i.pravatar.cc/150?u=jess" alt="User" />
                      </div>
                      <div>
                         <p className="font-bold text-primary-900">Jessica Chen</p>
                         <p className="text-xs text-primary-500 mt-0.5">2 hours ago • <span className="text-coral-600 font-semibold bg-coral-50 px-1.5 py-0.5 rounded">Forked your recipe</span></p>
                      </div>
                   </div>
                   <button className="text-primary-400 hover:text-primary-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                
                <div className="px-5 pb-4">
                   <p className="text-primary-800 leading-relaxed">
                     Made the <span className="font-semibold text-coral-600">Spicy Tuscan Shrimp</span> for the family tonight but swapped the heavy cream for coconut milk to make it dairy-free. Absolute game changer! 🥥🔥
                   </p>
                </div>

                <div className="mx-5 mb-4 rounded-xl overflow-hidden aspect-video relative group cursor-pointer">
                   <img src={MOCK_RECIPES[0].image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Food" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                   <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="font-bold text-sm">Spicy Tuscan Shrimp (Coconut Fork)</p>
                      <div className="flex items-center gap-2 text-xs opacity-90 mt-1">
                         <Clock className="w-3 h-3" /> 25m • Easy
                      </div>
                   </div>
                </div>

                <div className="px-5 py-3 border-t border-primary-50 flex items-center justify-between">
                   <div className="flex gap-4">
                      <button className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-coral-500 transition-colors">
                        <Heart className="w-5 h-5" /> 24
                      </button>
                      <button className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-5 h-5" /> 5
                      </button>
                   </div>
                   <button className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-green-600 transition-colors">
                      <Share2 className="w-5 h-5" /> Share
                   </button>
                </div>
             </div>

             {/* Feed Item 2 */}
             <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
                <div className="p-5 flex items-start justify-between">
                   <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden">
                         <img src="https://i.pravatar.cc/150?u=tom" alt="User" />
                      </div>
                      <div>
                         <p className="font-bold text-primary-900">Tom Baker</p>
                         <p className="text-xs text-primary-500 mt-0.5">5 hours ago</p>
                      </div>
                   </div>
                </div>
                
                <div className="px-5 pb-4">
                   <p className="text-primary-800 leading-relaxed">
                     Does anyone have a reliable gluten-free pizza dough recipe? The last 3 I tried were like cardboard. 😩
                   </p>
                </div>

                <div className="px-5 py-3 border-t border-primary-50 flex items-center justify-between">
                   <div className="flex gap-4">
                      <button className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-coral-500 transition-colors">
                        <Heart className="w-5 h-5" /> 3
                      </button>
                      <button className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-5 h-5" /> 12 Comments
                      </button>
                   </div>
                   <button className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-green-600 transition-colors">
                      <Share2 className="w-5 h-5" /> Share
                   </button>
                </div>
             </div>

          </div>

          {/* RIGHT SIDEBAR - Discovery */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
             {/* Weekly Challenge */}
             <div className="bg-gradient-to-br from-coral-500 to-terracotta-600 rounded-2xl p-5 text-white shadow-lg shadow-coral-500/20">
                <div className="flex items-center gap-2 mb-3">
                   <Flame className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                   <h3 className="font-bold text-sm uppercase tracking-wide">Weekly Challenge</h3>
                </div>
                <h4 className="text-xl font-display font-bold mb-2">Best Burger 🍔</h4>
                <p className="text-sm text-white/90 mb-4 leading-snug">Create your ultimate burger recipe. Highest voted fork wins a badge!</p>
                <div className="flex justify-between items-center text-xs font-medium bg-white/10 rounded-lg p-2 mb-4">
                   <span>Ends in 2 days</span>
                   <span>142 Entries</span>
                </div>
                <button className="w-full bg-white text-coral-600 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors shadow-sm">
                   Join Challenge
                </button>
             </div>

             {/* Suggested Chefs */}
             <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-5">
                <h3 className="font-bold text-sm uppercase text-primary-400 mb-4">Chefs to Follow</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                          <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="Chef" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary-900 truncate">Chef Name {i}</p>
                          <p className="text-xs text-primary-500 truncate">Italian Cuisine</p>
                       </div>
                       <button className="text-coral-600 text-xs font-bold hover:bg-coral-50 px-2.5 py-1.5 rounded-lg transition-colors">Follow</button>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-xs font-bold text-primary-500 hover:text-primary-700 py-2">View More</button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
