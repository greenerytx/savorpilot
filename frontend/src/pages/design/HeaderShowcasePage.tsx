import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  MessageCircle,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Mocks for showcase
const UserAvatar = () => (
  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-700 to-coral-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
    MR
  </div>
);

const NotificationBadge = () => (
  <div className="relative p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors cursor-pointer">
    <Bell className="w-5 h-5" />
    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
  </div>
);

// --- OPTION A: Refined Standard (The "Polished" Version) ---
function HeaderOptionA() {
  const [activeTab, setActiveTab] = useState('Home');
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-primary-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - Perfectly Aligned */}
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

          {/* Nav Pills - Refined */}
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

              {/* Dropdown Menu */}
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

          {/* Right Actions - Clean */}
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

// --- OPTION B: Social Centric (Facebook/Twitter Style) ---
function HeaderOptionB() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-6 flex-1">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-coral-500 rounded-lg flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" fill="currentColor" />
                </div>
                <span className="font-bold text-xl tracking-tight hidden md:block">SavorPilot</span>
             </div>
             
             <div className="hidden md:flex items-center max-w-md w-full relative">
               <Search className="w-4 h-4 absolute left-3 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search recipes, people, tags..." 
                 className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-coral-500 focus:bg-white transition-all"
               />
             </div>
          </div>

          {/* Center: Main Nav Icons */}
          <div className="flex items-center justify-center gap-1 md:gap-8 flex-1">
             <button className="p-3 text-coral-600 border-b-2 border-coral-600 rounded-none relative">
               <Home className="w-6 h-6" />
             </button>
             <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl relative group">
               <Compass className="w-6 h-6 group-hover:text-gray-600 transition-colors" />
             </button>
             <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl relative group">
               <Users className="w-6 h-6 group-hover:text-gray-600 transition-colors" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-coral-500 rounded-full ring-2 ring-white" />
             </button>
             <button className="p-3 text-gray-400 hover:bg-gray-50 rounded-xl relative group">
               <BarChart3 className="w-6 h-6 group-hover:text-gray-600 transition-colors" />
             </button>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center justify-end gap-3 flex-1">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full bg-gray-50">
               <MessageCircle className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full bg-gray-50">
               <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white ring-offset-1">
               <img src="https://i.pravatar.cc/150?u=mr" alt="User" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- OPTION C: Utility / Power User (Dense & Functional) ---
function HeaderOptionC() {
  return (
    <header className="flex flex-col">
       {/* Top Bar - System & Quick Links */}
       <div className="bg-primary-900 text-primary-200 text-xs py-1.5 px-4 border-b border-primary-800">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Help Center</span>
              <span className="hover:text-white cursor-pointer transition-colors">Community Guidelines</span>
            </div>
            <div className="flex gap-4">
               <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-400" /> Pro Member</span>
               <span>English (US)</span>
            </div>
         </div>
       </div>

       {/* Main Bar */}
       <nav className="bg-white border-b border-primary-200 shadow-sm">
         <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-8">
               {/* Brand */}
               <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 bg-coral-600 rounded flex items-center justify-center text-white font-serif font-bold text-lg">S</div>
                  <span className="font-serif font-bold text-xl text-primary-900">SavorPilot</span>
               </div>

               {/* Divider */}
               <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

               {/* Dense Nav Links */}
               <div className="hidden md:flex items-center gap-6 text-sm font-medium text-primary-700 flex-1">
                  <a href="#" className="hover:text-coral-600 transition-colors">Dashboard</a>
                  <a href="#" className="hover:text-coral-600 transition-colors flex items-center gap-1">My Recipes <ChevronDown className="w-3 h-3" /></a>
                  <a href="#" className="hover:text-coral-600 transition-colors flex items-center gap-1">Planning <ChevronDown className="w-3 h-3" /></a>
                  <a href="#" className="hover:text-coral-600 transition-colors">Shop</a>
                  <a href="#" className="hover:text-coral-600 transition-colors">Analytics</a>
               </div>

               {/* Search & Actions */}
               <div className="flex items-center gap-3 shrink-0">
                  <div className="relative hidden lg:block">
                     <input type="text" placeholder="Quick find (Ctrl+K)" className="bg-primary-50 border border-primary-200 rounded-md px-3 py-1.5 text-sm w-48 focus:w-64 transition-all focus:ring-1 focus:ring-coral-500 focus:outline-none" />
                     <Search className="w-4 h-4 text-primary-400 absolute right-3 top-2" />
                  </div>
                  <button className="bg-coral-600 hover:bg-coral-700 text-white px-3 py-1.5 rounded text-sm font-semibold shadow-sm flex items-center gap-1">
                     <Plus className="w-4 h-4" /> Add
                  </button>
               </div>
            </div>
         </div>
       </nav>
    </header>
  );
}

// --- OPTION D: Minimalist (Focus on Content) ---
function HeaderOptionD() {
  return (
    <nav className="bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
               <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <span className="font-bold text-xl tracking-tighter">GRAMGRAB</span>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-6">
             <a href="#" className="text-sm font-medium text-gray-900 border-b-2 border-black pb-0.5">Cook</a>
             <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Discover</a>
             <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Shop</a>
          </div>

          <div className="flex items-center gap-4">
             <Search className="w-5 h-5 text-gray-600 cursor-pointer hover:text-black" />
             <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs cursor-pointer">
                MR
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function HeaderShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-100 pb-24 font-sans">
      <div className="bg-primary-900 text-white py-12 px-6 mb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Header Design Explorations</h1>
          <p className="text-primary-200 text-lg">
            Exploring different navigation paradigms for the "Social Cooking" evolution.
            Compare interactions, density, and visual weight.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-20">
        
        {/* Option A */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-primary-900">Option A: Refined Modern</h2>
            <span className="px-3 py-1 bg-coral-100 text-coral-700 rounded-full text-xs font-bold uppercase">Evolutionary</span>
          </div>
          <p className="text-gray-600 px-2 max-w-2xl">
            A polished version of the current header. Fixes alignment and brings <strong>"Plan"</strong> up to the top level 
            so it's not hidden. Groups actions logically and uses a "pill" nav for a cleaner look.
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xl bg-cream-50 h-[300px] relative">
            <HeaderOptionA />
            <div className="p-8 flex items-center justify-center opacity-30">
               <span className="text-4xl font-bold text-primary-200">Content Area</span>
            </div>
          </div>
        </section>

        {/* Option B */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-primary-900">Option B: Social Network</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Social First</span>
          </div>
          <p className="text-gray-600 px-2 max-w-2xl">
            Prioritizes the "Feed" and discovery. Central navigation icons (like Facebook/Twitter) 
            encourage frequent switching between Home, Explore, and Notifications. Search is dominant.
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xl bg-gray-50 h-[300px] relative">
            <HeaderOptionB />
            <div className="p-8 flex flex-col items-center gap-4 opacity-50 mt-4">
               <div className="w-full max-w-md h-32 bg-white rounded-lg border border-gray-200 shadow-sm"></div>
               <div className="w-full max-w-md h-32 bg-white rounded-lg border border-gray-200 shadow-sm"></div>
            </div>
          </div>
        </section>

        {/* Option C */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-primary-900">Option C: Power Utility</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">Density</span>
          </div>
          <p className="text-gray-600 px-2 max-w-2xl">
            A "Double-Decker" approach found in complex e-commerce or SaaS apps. 
            Separates system/account links from main navigation. Great if we add a Shop/Marketplace.
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xl bg-white h-[300px] relative">
            <HeaderOptionC />
            <div className="p-8 grid grid-cols-4 gap-4 opacity-30 mt-4">
               <div className="h-32 bg-gray-100 rounded"></div>
               <div className="h-32 bg-gray-100 rounded"></div>
               <div className="h-32 bg-gray-100 rounded"></div>
               <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </div>
        </section>

        {/* Option D */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-primary-900">Option D: Ultra Minimal</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">Lifestyle</span>
          </div>
          <p className="text-gray-600 px-2 max-w-2xl">
            Hides complexity behind a menu. Focuses entirely on the brand and 2-3 key actions. 
            Very editorial/magazine feel.
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xl bg-white h-[300px] relative">
            <HeaderOptionD />
            <div className="relative h-full w-full">
               <div className="absolute inset-0 bg-neutral-900 opacity-5"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <h1 className="text-4xl font-serif text-gray-800 opacity-20">The Art of Cooking</h1>
               </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
