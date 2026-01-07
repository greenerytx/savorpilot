import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChefHat,
  Home,
  UtensilsCrossed,
  FolderOpen,
  Share2,
  Calendar,
  ShoppingCart,
  Settings,
  LogOut,
  Plus,
  Sparkles,
  Instagram,
  Youtube,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { labelKey: 'sidebar.home', href: '/', icon: Home },
  { labelKey: 'sidebar.myRecipes', href: '/recipes', icon: UtensilsCrossed },
  { labelKey: 'sidebar.collections', href: '/collections', icon: FolderOpen },
  { labelKey: 'sidebar.savedPosts', href: '/saved-posts', icon: Instagram },
  { labelKey: 'sidebar.youtube', href: '/youtube', icon: Youtube },
  { labelKey: 'sidebar.shared', href: '/shared', icon: Share2 },
];

const planningNavItems: NavItem[] = [
  { labelKey: 'sidebar.mealPlanner', href: '/meal-planner', icon: Calendar },
  { labelKey: 'sidebar.shoppingList', href: '/shopping-list', icon: ShoppingCart },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const { user, logout } = useAuthStore();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href ||
      (item.href !== '/' && location.pathname.startsWith(item.href));

    return (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        )}
      >
        <item.icon className={cn('w-5 h-5', isActive ? 'text-primary-500' : '')} />
        {t(item.labelKey)}
      </NavLink>
    );
  };

  return (
    <aside data-sidebar className="fixed start-0 top-0 h-screen w-64 bg-white border-e border-neutral-100 flex flex-col print:hidden">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900">{t('brand.name')}</span>
        </div>
      </div>

      {/* Add Recipe Button */}
      <div className="px-4 mb-2">
        <NavLink
          to="/recipes/new?source=image"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('actions.addRecipe')}
        </NavLink>
      </div>

      {/* Generate Recipe */}
      <div className="px-4 mb-6">
        <NavLink
          to="/generate"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-primary-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-5 h-5" />
          {t('actions.generateRecipe')}
        </NavLink>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItemComponent key={item.labelKey} item={item} />
          ))}
        </div>

        <div className="pt-6">
          <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            {t('sidebar.planning')}
          </p>
          <div className="space-y-1">
            {planningNavItems.map((item) => (
              <NavItemComponent key={item.labelKey} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
          </div>
        </div>

        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t('sidebar.settings')}
        </NavLink>

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('sidebar.signOut')}
        </button>
      </div>
    </aside>
  );
}
