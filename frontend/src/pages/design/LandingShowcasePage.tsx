import { useState } from 'react';
import {
  Search,
  Plus,
  Zap,
  BookOpen,
  Flame,
  Globe2,
  Shield,
  Clock,
  Heart,
  FlaskConical,
  ChefHat,
  Users,
  Bell,
  ArrowRight,
  Sparkles,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Award,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui';

// Mock Data
const MOCK_USER = { firstName: 'Mohammed', lastName: 'Hammoud' };
const MOCK_RECIPES = [
  { id: 1, title: 'Spicy Tuscan Shrimp', author: 'Chef Bella', time: '25m', likes: 1240, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80' },
  { id: 2, title: 'Golden Milk Latte', author: 'Wellness Co', time: '5m', likes: 850, image: 'https://images.unsplash.com/photo-1515516901840-058a705146c0?auto=format&fit=crop&q=80' },
  { id: 3, title: 'Avocado Toast Deluxe', author: 'Brunch Master', time: '10m', likes: 3200, image: 'https://images.unsplash.com/photo-1541519227354-08fa5d625a87?auto=format&fit=crop&q=80' },
];

const OptionWrapper = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
  <div className="space-y-4 mb-20 border-b pb-20 border-gray-200 last:border-0">
    <div className="px-4">
      <h2 className="text-2xl font-bold text-primary-900">{title}</h2>
      <p className="text-gray-600">{desc}</p>
    </div>
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xl bg-cream-50 mx-4 min-h-[600px] relative">
      {children}
    </div>
  </div>
);

// --- VARIATION A: The "Daily Driver" (Dashboard/Utility) ---
// Focus: "What do I need to do right now?"
function LandingOptionA() {
  return (
    <div className="bg-cream-50 min-h-full font-sans text-primary-900">
      {/* Dynamic Hero */}
      <div className="bg-white p-6 pb-8 border-b border-primary-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-coral-500 font-bold text-sm uppercase tracking-wider mb-1">Monday Evening</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-900">
                Good evening, {MOCK_USER.firstName}.
              </h1>
              <p className="text-primary-500 mt-2 text-lg">
                You have <span className="font-semibold text-primary-800 border-b-2 border-coral-200">Lemon Herb Chicken</span> planned for dinner.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-primary-400">Weather</p>
              <p className="text-lg font-bold">72°F 🌤️</p>
              <p className="text-xs text-primary-400">Perfect for grilling</p>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button className="flex items-center gap-2 bg-primary-900 text-white px-5 py-2.5 rounded-full font-semibold whitespace-nowrap shadow-lg shadow-primary-900/20 hover:scale-105 transition-transform">
              <ChefHat className="w-4 h-4" /> Start Cooking
            </button>
            <button className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-full font-semibold whitespace-nowrap hover:bg-primary-50">
              <ShoppingCart className="w-4 h-4 text-coral-500" /> Shop Ingredients (4)
            </button>
            <button className="flex items-center gap-2 bg-white text-primary-700 border border-primary-200 px-5 py-2.5 rounded-full font-semibold whitespace-nowrap hover:bg-primary-50">
               <Zap className="w-4 h-4 text-yellow-500" /> AI Suggest Side Dish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-10">
        {/* Active Circles Strip */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Your Circles</h3>
            <button className="text-sm text-coral-600 font-medium">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[
              { name: 'Family Potluck', status: 'Event on Sat', color: 'bg-coral-100 text-coral-700' },
              { name: 'Keto Crew', status: '3 new recipes', color: 'bg-green-100 text-green-700' },
              { name: 'Office Lunch', status: 'Planning...', color: 'bg-blue-100 text-blue-700' },
            ].map((circle, i) => (
              <div key={i} className="min-w-[160px] p-4 bg-white rounded-xl border border-primary-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className={`w-8 h-8 rounded-full ${circle.color} flex items-center justify-center font-bold text-xs mb-3`}>
                  {circle.name[0]}
                </div>
                <p className="font-bold text-sm text-primary-900">{circle.name}</p>
                <p className="text-xs text-primary-500 mt-1">{circle.status}</p>
              </div>
            ))}
            <div className="min-w-[60px] flex items-center justify-center">
               <button className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center hover:bg-primary-200">
                 <Plus className="w-5 h-5" />
               </button>
            </div>
          </div>
        </section>

        {/* Recent Saves Carousel */}
        <section>
          <h3 className="font-bold text-lg mb-4">Jump Back In</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {MOCK_RECIPES.map((recipe) => (
               <div key={recipe.id} className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer">
                 <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                 <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-bold text-sm truncate pr-4">{recipe.title}</p>
                    <p className="text-xs text-white/70">{recipe.time} • {recipe.author}</p>
                 </div>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- VARIATION B: The "Social Feed" (Activity/Community) ---
// Focus: "What is everyone else doing?"
function LandingOptionB() {
  return (
    <div className="bg-gray-50 min-h-full font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        
        {/* Left Sidebar (Navigation & Trends) */}
        <div className="hidden md:block md:col-span-3 space-y-6">
           <div className="bg-white rounded-xl shadow-sm p-4 space-y-1">
              <div className="font-bold text-lg mb-2 px-2">Trending Tags</div>
              {['#MeatlessMonday', '#QuickDinner', '#Sourdough', '#SpicyChallenge'].map(tag => (
                <div key={tag} className="px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-coral-600 rounded-lg cursor-pointer transition-colors">
                  {tag}
                </div>
              ))}
           </div>

           <div className="bg-gradient-to-br from-coral-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
              <h3 className="font-bold text-lg mb-1">Weekly Challenge</h3>
              <p className="text-sm text-white/90 mb-4">"Best Burger" ends in 2 days!</p>
              <button className="w-full bg-white text-coral-600 py-2 rounded-lg font-bold text-sm hover:bg-gray-50">
                Join Now
              </button>
           </div>
        </div>

        {/* Main Feed */}
        <div className="col-span-1 md:col-span-6 space-y-6">
           {/* Composer */}
           <div className="bg-white rounded-xl shadow-sm p-4 flex gap-3 items-center cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=me" alt="Me" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-500 text-sm">
                Cooked something tasty? Share it...
              </div>
              <button className="p-2 text-coral-500 hover:bg-coral-50 rounded-full">
                <Flame className="w-5 h-5" />
              </button>
           </div>

           {/* Feed Item 1 */}
           <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       <img src="https://i.pravatar.cc/150?u=jess" alt="User" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-900">Jessica Chen</p>
                       <p className="text-xs text-gray-500">2 hours ago • <span className="text-coral-500 font-medium">Forked your recipe</span></p>
                    </div>
                 </div>
                 <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
              <div className="px-4 pb-3">
                 <p className="text-gray-800 text-sm">Made this for the family tonight but swapped the heavy cream for coconut milk. Absolute game changer! 🥥🔥</p>
              </div>
              <div className="bg-gray-100 aspect-video relative">
                 <img src={MOCK_RECIPES[0].image} className="w-full h-full object-cover" alt="Food" />
                 <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                    Spicy Tuscan Shrimp
                 </div>
              </div>
              <div className="p-3 border-t border-gray-100 flex items-center justify-between text-gray-500 text-sm">
                 <button className="flex items-center gap-1 hover:text-red-500"><Heart className="w-4 h-4" /> 24</button>
                 <button className="hover:text-blue-500">Comment</button>
                 <button className="hover:text-green-500">Fork</button>
              </div>
           </div>

           {/* Feed Item 2 */}
           <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       <img src="https://i.pravatar.cc/150?u=tom" alt="User" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-900">Tom Baker</p>
                       <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                 </div>
              </div>
              <div className="px-4 pb-3">
                 <p className="text-gray-800 text-sm">Does anyone have a reliable gluten-free pizza dough recipe? The last 3 I tried were like cardboard. 😩</p>
              </div>
              <div className="p-3 border-t border-gray-100 flex items-center justify-between text-gray-500 text-sm">
                 <button className="flex items-center gap-1 hover:text-red-500"><Heart className="w-4 h-4" /> 5</button>
                 <button className="hover:text-blue-500">12 Comments</button>
                 <button className="hover:text-green-500">Share</button>
              </div>
           </div>
        </div>

        {/* Right Sidebar (Suggested) */}
        <div className="hidden md:block md:col-span-3 space-y-6">
           <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="font-bold text-lg mb-4">Chefs to Follow</div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 mb-4 last:mb-0">
                   <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Chef" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">Chef Name {i}</p>
                      <p className="text-xs text-gray-500 truncate">Italian Cuisine</p>
                   </div>
                   <button className="text-coral-600 text-xs font-bold hover:bg-coral-50 px-2 py-1 rounded">Follow</button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

// --- VARIATION C: The "Visual Explorer" (Editorial/Discovery) ---
// Focus: "Inspire me with beauty."
function LandingOptionC() {
  return (
    <div className="bg-white min-h-full font-serif text-gray-900">
      {/* Immersive Hero */}
      <div className="relative h-[500px] w-full overflow-hidden">
        <img src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Hero Food" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center px-4">
           <div className="max-w-2xl text-white space-y-6">
              <span className="inline-block px-3 py-1 border border-white/30 rounded-full text-xs font-sans tracking-widest uppercase backdrop-blur-md">Featured Collection</span>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">The Art of Rustic Bread</h1>
              <p className="text-lg md:text-xl text-white/90 font-sans max-w-lg mx-auto">Master the basics of sourdough with our step-by-step guide from Chef Baker.</p>
              <button className="bg-white text-black px-8 py-3 rounded-full font-sans font-bold hover:bg-gray-100 transition-colors">
                Explore Collection
              </button>
           </div>
        </div>
      </div>

      {/* Editorial Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">
        
        {/* Curated Section */}
        <section>
           <div className="flex justify-between items-end mb-8 border-b border-black pb-4">
              <h2 className="text-3xl font-bold italic">Fresh this Week</h2>
              <a href="#" className="font-sans text-sm font-bold uppercase tracking-wider hover:underline">View Archive</a>
           </div>
           
           <div className="grid md:grid-cols-4 gap-6 font-sans">
              <div className="md:col-span-2 group cursor-pointer">
                 <div className="aspect-[4/3] overflow-hidden mb-3">
                    <img src="https://images.unsplash.com/photo-1476718406336-bb5a9690ee2b?auto=format&fit=crop&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Soup" />
                 </div>
                 <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">Dinner</span>
                 <h3 className="text-xl font-bold mt-1 group-hover:underline">Roasted Tomato Basil Soup</h3>
              </div>
              <div className="group cursor-pointer">
                 <div className="aspect-[3/4] overflow-hidden mb-3">
                    <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Pizza" />
                 </div>
                 <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">Weekend</span>
                 <h3 className="text-lg font-bold mt-1 group-hover:underline">Neapolitan Pizza at Home</h3>
              </div>
              <div className="group cursor-pointer">
                 <div className="aspect-[3/4] overflow-hidden mb-3">
                    <img src="https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Salad" />
                 </div>
                 <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">Healthy</span>
                 <h3 className="text-lg font-bold mt-1 group-hover:underline">Green Goddess Bowl</h3>
              </div>
           </div>
        </section>

        {/* Categories / Navigation */}
        <section className="bg-cream-50 py-12 px-8 -mx-8">
           <h2 className="text-center text-2xl font-bold italic mb-10">Browse by Mood</h2>
           <div className="flex flex-wrap justify-center gap-4 font-sans">
              {['Cozy Comfort', 'Quick & Easy', 'Date Night', 'Healthy Kick', 'Sweet Tooth', 'Party Food'].map(mood => (
                <button key={mood} className="px-6 py-3 bg-white border border-gray-200 rounded-full hover:border-black hover:shadow-lg transition-all text-sm font-bold">
                   {mood}
                </button>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
}

export function LandingShowcasePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-primary-900 text-white py-12 px-6 mb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Landing Page Variations</h1>
          <p className="text-primary-200 text-lg">
            Three distinct approaches to the "Social Cooking" homepage. 
            Scroll down to explore each paradigm.
          </p>
        </div>
      </div>

      <OptionWrapper 
        title="Variation A: The Daily Driver" 
        desc="Utility-first. Focuses on 'What do I need to do now?' (Cook, Shop, Plan). Integrates social circles as a secondary status update."
      >
        <LandingOptionA />
      </OptionWrapper>

      <OptionWrapper 
        title="Variation B: The Social Feed" 
        desc="Community-first. Modeled after Instagram/Twitter. The primary value is seeing what others are doing to get inspired."
      >
        <LandingOptionB />
      </OptionWrapper>

      <OptionWrapper 
        title="Variation C: The Visual Explorer" 
        desc="Inspiration-first. Modeled after Pinterest/Bon Appétit. Focuses on high-quality imagery and editorial collections."
      >
        <LandingOptionC />
      </OptionWrapper>

    </div>
  );
}
