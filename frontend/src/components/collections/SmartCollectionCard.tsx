import { Link } from 'react-router-dom';
import {
  Clock,
  Utensils,
  Cake,
  Coffee,
  Flame,
  Heart,
  Leaf,
  Salad,
  Soup,
  Star,
  Sun,
  Moon,
  Zap,
  Smile,
  Gift,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Badge } from '../ui';
import type { SmartCollection } from '../../types/smart-collection';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  clock: Clock,
  utensils: Utensils,
  cake: Cake,
  coffee: Coffee,
  flame: Flame,
  heart: Heart,
  leaf: Leaf,
  salad: Salad,
  soup: Soup,
  star: Star,
  sun: Sun,
  moon: Moon,
  zap: Zap,
  smile: Smile,
  gift: Gift,
  calendar: Calendar,
  sparkles: Sparkles,
};

// Color mapping for backgrounds
const colorMap: Record<string, string> = {
  red: 'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
  amber: 'bg-amber-100 text-amber-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  lime: 'bg-lime-100 text-lime-600',
  green: 'bg-green-100 text-green-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  teal: 'bg-teal-100 text-teal-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  sky: 'bg-sky-100 text-sky-600',
  blue: 'bg-blue-100 text-blue-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  violet: 'bg-violet-100 text-violet-600',
  purple: 'bg-purple-100 text-purple-600',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-600',
  pink: 'bg-pink-100 text-pink-600',
  rose: 'bg-rose-100 text-rose-600',
};

interface SmartCollectionCardProps {
  collection: SmartCollection;
}

export function SmartCollectionCard({ collection }: SmartCollectionCardProps) {
  const Icon = iconMap[collection.icon || 'sparkles'] || Sparkles;
  const colorClasses = colorMap[collection.color || 'purple'] || colorMap.purple;

  return (
    <Link to={`/collections/smart/${collection.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses}`}>
            <Icon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                {collection.name}
              </h3>
              {collection.isSystem && (
                <Badge variant="secondary" className="text-xs">
                  Auto
                </Badge>
              )}
            </div>

            {collection.description && (
              <p className="text-sm text-neutral-500 mt-0.5 truncate">
                {collection.description}
              </p>
            )}

            <p className="text-sm text-neutral-400 mt-1">
              {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="text-neutral-300 group-hover:text-primary-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Card>
    </Link>
  );
}
