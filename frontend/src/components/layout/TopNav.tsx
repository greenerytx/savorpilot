import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  X,
  Users,
  PartyPopper,
  Compass,
  Plus,
  Sparkles,
  FlaskConical,
  BarChart3,
  Dna,
  Bell,
  Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { NotificationDropdown } from '../notifications';
import { LanguageSwitcher } from '../ui';
import { useActivityFeed } from '../../hooks/useActivityFeed';

// ============================================
// Option A: Refined Modern Navigation
// ============================================

export function TopNav() {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const { user, logout } = useAuthStore();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  const [showRecipesMenu, setShowRecipesMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Activity feed - check for unread items
  const { data: activityData } = useActivityFeed(1);
  const hasUnreadActivity = (activityData?.pages?.[0]?.unreadCount || 0) > 0;
  const hasAnyActivity = (activityData?.pages?.[0]?.total || 0) > 0;

  // Close all menus on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
    setShowPlanMenu(false);
    setShowRecipesMenu(false);
    setShowCreateMenu(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const isAnyPlanActive = ['/meal-planner', '/shopping-list', '/nutrition', '/events'].some(p => location.pathname.startsWith(p));
  const isAnyRecipesActive = ['/recipes', '/collections', '/flavor-dna'].some(p => location.pathname.startsWith(p));

  // Plan dropdown items
  const planItems = [
    { name: 'Meal Planner', href: '/meal-planner', icon: Calendar, desc: 'Weekly schedule' },
    { name: 'Shopping List', href: '/shopping-list', icon: ShoppingCart, desc: 'Groceries' },
    { name: 'Nutrition', href: '/nutrition', icon: BarChart3, desc: 'Health goals' },
    { name: 'Party Mode', href: '/events', icon: PartyPopper, desc: 'Events' },
  ];

  // Recipes dropdown items
  const recipesItems = [
    { name: 'My Recipes', href: '/recipes', icon: UtensilsCrossed, desc: 'Your collection' },
    { name: 'Collections', href: '/collections', icon: FolderOpen, desc: 'Organized folders' },
    { name: 'Flavor DNA', href: '/flavor-dna', icon: Dna, desc: 'Taste profile' },
  ];

  // Create menu items
  const createMenu = {
    import: [
      { name: 'From URL', href: '/recipes/new?source=url', icon: Link2, desc: 'Paste any link' },
      { name: 'Saved Posts', href: '/saved-posts', icon: Instagram, desc: 'From Instagram' },
      { name: 'YouTube', href: '/youtube', icon: Youtube, desc: 'From videos' },
    ],
    create: [
      { name: 'AI Generate', href: '/generate', icon: Sparkles, desc: 'Create with AI' },
      { name: 'Fusion Lab', href: '/fusion-lab', icon: FlaskConical, desc: 'Merge recipes' },
    ],
  };

  // Dropdown component for reuse
  const DropdownMenu = ({
    items,
    show,
    onClose
  }: {
    items: { name: string; href: string; icon: any; desc: string }[];
    show: boolean;
    onClose: () => void;
  }) => {
    if (!show) return null;
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-primary-100 p-2 z-50 animate-fade-in">
          <div className="space-y-0.5">
            {items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors text-left group"
              >
                <div className="mt-0.5 p-1.5 bg-primary-50 group-hover:bg-white rounded-md text-primary-500 group-hover:text-coral-500 transition-colors shadow-sm">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-primary-900">{item.name}</span>
                  <span className="block text-xs text-primary-400">{item.desc}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 print:hidden">
      <div className="bg-white/80 backdrop-blur-md border-b border-primary-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo - Square Container Style */}
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="logo-container w-10 h-10 sm:w-11 sm:h-11 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold text-primary-900 leading-none tracking-tight">
                  Savor<span className="text-coral-500">Pilot</span>
                </span>
                <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-widest mt-0.5">
                  Social Cooking
                </span>
              </div>
            </NavLink>

            {/* Nav Pills - Desktop */}
            <div className="hidden lg:flex items-center nav-pill-container">
              {/* Home */}
              <NavLink
                to="/"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  isActive('/')
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <Home className={cn('w-4 h-4', isActive('/') ? 'text-coral-500' : 'text-primary-400')} />
                Home
              </NavLink>

              {/* Explore */}
              <NavLink
                to="/explore"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  isActive('/explore')
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <Compass className={cn('w-4 h-4', isActive('/explore') ? 'text-coral-500' : 'text-primary-400')} />
                Explore
              </NavLink>

              {/* Plan Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setShowPlanMenu(true)}
                onMouseLeave={() => setShowPlanMenu(false)}
              >
                <button
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                    isAnyPlanActive
                      ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                      : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                  )}
                >
                  <Calendar className={cn('w-4 h-4', isAnyPlanActive ? 'text-coral-500' : 'text-primary-400')} />
                  Plan
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                </button>
                <DropdownMenu items={planItems} show={showPlanMenu} onClose={() => setShowPlanMenu(false)} />
              </div>

              {/* Recipes Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setShowRecipesMenu(true)}
                onMouseLeave={() => setShowRecipesMenu(false)}
              >
                <button
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                    isAnyRecipesActive
                      ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                      : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                  )}
                >
                  <UtensilsCrossed className={cn('w-4 h-4', isAnyRecipesActive ? 'text-coral-500' : 'text-primary-400')} />
                  Recipes
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
                </button>
                <DropdownMenu items={recipesItems} show={showRecipesMenu} onClose={() => setShowRecipesMenu(false)} />
              </div>

              {/* Circles */}
              <NavLink
                to="/circles"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  isActive('/circles')
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <Users className={cn('w-4 h-4', isActive('/circles') ? 'text-coral-500' : 'text-primary-400')} />
                Circles
              </NavLink>

              {/* Activity */}
              <NavLink
                to="/feed"
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200',
                  isActive('/feed')
                    ? 'bg-white text-primary-900 shadow-sm ring-1 ring-primary-100'
                    : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/50'
                )}
              >
                <Bell className={cn('w-4 h-4', isActive('/feed') ? 'text-coral-500' : 'text-primary-400')} />
                Activity
                {hasUnreadActivity && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
                )}
              </NavLink>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search & Notifications - Desktop */}
              <div className="hidden sm:flex items-center gap-1 border-r border-primary-100 pr-3 mr-1">
                <button className="p-2 text-primary-400 hover:text-coral-500 hover:bg-coral-50 rounded-full transition-all">
                  <Search className="w-5 h-5" />
                </button>
                <NotificationDropdown />
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Create Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className={cn(
                    'hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95',
                    showCreateMenu
                      ? 'bg-primary-800 text-white shadow-primary-900/20'
                      : 'bg-primary-900 text-white hover:bg-primary-800 shadow-primary-900/20'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-bold">Create</span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', showCreateMenu && 'rotate-180')} />
                </button>

                {/* Create Mega Menu */}
                {showCreateMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-primary-100 p-3 z-50 animate-fade-in">
                      {/* Import Section */}
                      <div className="mb-3">
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider px-2">Import</span>
                        <div className="mt-1.5 space-y-0.5">
                          {createMenu.import.map((item) => (
                            <NavLink
                              key={item.href}
                              to={item.href}
                              onClick={() => setShowCreateMenu(false)}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                            >
                              <div className="mt-0.5 p-1.5 bg-blue-50 group-hover:bg-blue-100 rounded-md text-blue-500 transition-colors">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block text-sm font-semibold text-primary-900">{item.name}</span>
                                <span className="block text-xs text-primary-400">{item.desc}</span>
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </div>

                      {/* Create Section */}
                      <div className="pt-2 border-t border-primary-100">
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider px-2">Create</span>
                        <div className="mt-1.5 space-y-0.5">
                          {createMenu.create.map((item) => (
                            <NavLink
                              key={item.href}
                              to={item.href}
                              onClick={() => setShowCreateMenu(false)}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors group"
                            >
                              <div className="mt-0.5 p-1.5 bg-purple-50 group-hover:bg-purple-100 rounded-md text-purple-500 transition-colors">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block text-sm font-semibold text-primary-900">{item.name}</span>
                                <span className="block text-xs text-primary-400">{item.desc}</span>
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-primary-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-700 to-coral-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-primary-400 transition-transform hidden sm:block',
                    showUserMenu && 'rotate-180'
                  )} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-primary-100 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-primary-100">
                        <p className="font-semibold text-primary-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-primary-500 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <NavLink
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </NavLink>
                        <button
                          onClick={() => { setShowUserMenu(false); logout(); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="lg:hidden fixed inset-0 top-[80px] bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-[80px] left-0 bottom-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto border-r border-primary-100',
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 space-y-6">
          {/* Primary Navigation */}
          <div className="space-y-1">
            <NavLink to="/" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all', isActive('/') ? 'bg-primary-800 text-white' : 'text-primary-700 hover:bg-primary-50')}>
              <Home className="w-5 h-5" /> Home
            </NavLink>
            <NavLink to="/explore" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all', isActive('/explore') ? 'bg-primary-800 text-white' : 'text-primary-700 hover:bg-primary-50')}>
              <Compass className="w-5 h-5" /> Explore
            </NavLink>
            <NavLink to="/circles" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all', isActive('/circles') ? 'bg-primary-800 text-white' : 'text-primary-700 hover:bg-primary-50')}>
              <Users className="w-5 h-5" /> Circles
            </NavLink>
            <NavLink to="/feed" className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all', isActive('/feed') ? 'bg-primary-800 text-white' : 'text-primary-700 hover:bg-primary-50')}>
              <Bell className="w-5 h-5" /> Activity
            </NavLink>
          </div>

          <div className="border-t border-primary-100" />

          {/* Recipes Section */}
          <div className="space-y-1">
            <span className="block px-4 text-xs font-bold text-primary-400 uppercase tracking-wider">Recipes</span>
            {recipesItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all', isActive(item.href) ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50')}>
                <item.icon className="w-5 h-5" /> {item.name}
              </NavLink>
            ))}
          </div>

          {/* Plan Section */}
          <div className="space-y-1">
            <span className="block px-4 text-xs font-bold text-primary-400 uppercase tracking-wider">Plan</span>
            {planItems.map((item) => (
              <NavLink key={item.href} to={item.href} className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all', isActive(item.href) ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50')}>
                <item.icon className="w-5 h-5" /> {item.name}
              </NavLink>
            ))}
          </div>

          {/* Import Section */}
          <div className="space-y-1">
            <span className="block px-4 text-xs font-bold text-blue-500 uppercase tracking-wider">Import</span>
            {createMenu.import.map((item) => (
              <NavLink key={item.href} to={item.href} className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all', isActive(item.href) ? 'bg-blue-100 text-blue-700' : 'text-primary-600 hover:bg-blue-50')}>
                <item.icon className="w-5 h-5" /> {item.name}
              </NavLink>
            ))}
          </div>

          {/* Create Section */}
          <div className="space-y-1">
            <span className="block px-4 text-xs font-bold text-purple-500 uppercase tracking-wider">Create</span>
            {createMenu.create.map((item) => (
              <NavLink key={item.href} to={item.href} className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all', isActive(item.href) ? 'bg-purple-100 text-purple-700' : 'text-primary-600 hover:bg-purple-50')}>
                <item.icon className="w-5 h-5" /> {item.name}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-primary-100" />

          {/* User Section */}
          <div className="space-y-1">
            <div className="px-4 py-2">
              <p className="font-semibold text-primary-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-primary-500 truncate">{user?.email}</p>
            </div>
            <NavLink to="/settings" className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all', isActive('/settings') ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50')}>
              <Settings className="w-5 h-5" /> Settings
            </NavLink>
            <button onClick={() => { setShowMobileMenu(false); logout(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
