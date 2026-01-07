import { useFlavorProfile, useFlavorProfileSummary } from '../../hooks';
import { Card } from '../ui';
import { cn } from '../../lib/utils';
import { Loader2, TrendingUp, Utensils, Flame, Droplets, Cookie, Sparkles } from 'lucide-react';

interface FlavorProfileCardProps {
  className?: string;
  compact?: boolean;
}

const TASTE_CONFIG = {
  salt: { emoji: '🧂', label: 'Salt', lowLabel: 'Light', highLabel: 'Salty' },
  heat: { emoji: '🌶️', label: 'Heat', lowLabel: 'Mild', highLabel: 'Spicy' },
  acid: { emoji: '🍋', label: 'Acid', lowLabel: 'Mellow', highLabel: 'Tangy' },
  sweet: { emoji: '🍯', label: 'Sweet', lowLabel: 'Savory', highLabel: 'Sweet' },
  umami: { emoji: '🍄', label: 'Umami', lowLabel: 'Light', highLabel: 'Rich' },
};

const PROFILE_STRENGTH_CONFIG = {
  new: { label: 'New Profile', color: 'text-neutral-500', bg: 'bg-neutral-100', progress: 10 },
  developing: { label: 'Developing', color: 'text-blue-600', bg: 'bg-blue-100', progress: 35 },
  established: { label: 'Established', color: 'text-green-600', bg: 'bg-green-100', progress: 70 },
  strong: { label: 'Strong', color: 'text-purple-600', bg: 'bg-purple-100', progress: 100 },
};

export function FlavorProfileCard({ className, compact = false }: FlavorProfileCardProps) {
  const { data: profile, isLoading: profileLoading } = useFlavorProfile();
  const { data: summary, isLoading: summaryLoading } = useFlavorProfileSummary();

  const isLoading = profileLoading || summaryLoading;

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (!profile || !summary) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-neutral-500">
          <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Start cooking to build your Flavor DNA!</p>
        </div>
      </Card>
    );
  }

  const strengthConfig = PROFILE_STRENGTH_CONFIG[summary.profileStrength];

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">🧬</div>
          <div>
            <h3 className="font-semibold text-neutral-800">Your Flavor DNA</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', strengthConfig.bg, strengthConfig.color)}>
              {strengthConfig.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.tasteProfile).map(([key, value]) => {
            const config = TASTE_CONFIG[key as keyof typeof TASTE_CONFIG];
            return (
              <div
                key={key}
                className="flex items-center gap-1 px-2 py-1 bg-neutral-50 rounded-lg text-sm"
                title={`${config.label}: ${value}`}
              >
                <span>{config.emoji}</span>
                <span className="text-neutral-600 capitalize">{value}</span>
              </div>
            );
          })}
        </div>

        {summary.favoriteCuisines.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-xs text-neutral-500">Top cuisines: </span>
            <span className="text-sm text-neutral-700">
              {summary.favoriteCuisines.join(', ')}
            </span>
          </div>
        )}
      </Card>
    );
  }

  // Full version
  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-amber-500 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧬</span>
            <div>
              <h2 className="text-xl font-bold">Your Flavor DNA</h2>
              <p className="text-white/80 text-sm">Personalized taste profile</p>
            </div>
          </div>
          <div className={cn('px-3 py-1 rounded-full text-sm font-medium', 'bg-white/20')}>
            {strengthConfig.label}
          </div>
        </div>

        {/* Progress to next level */}
        {summary.recipesNeededForNextLevel > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/80 mb-1">
              <span>Profile Strength</span>
              <span>{summary.recipesNeededForNextLevel} more recipes to level up</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${strengthConfig.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Taste Preferences */}
      <div className="p-6">
        <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Taste Preferences
        </h3>

        <div className="space-y-4">
          {Object.entries(TASTE_CONFIG).map(([key, config]) => {
            const prefKey = `${key}Preference` as keyof typeof profile;
            const value = (profile[prefKey] as number) ?? 0.5;
            const percentage = Math.round(value * 100);

            return (
              <div key={key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span className="font-medium text-neutral-700">{config.label}</span>
                  </div>
                  <span className="text-neutral-500">
                    {value < 0.35 ? config.lowLabel : value > 0.65 ? config.highLabel : 'Balanced'}
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      value < 0.35
                        ? 'bg-blue-400'
                        : value > 0.65
                        ? 'bg-orange-400'
                        : 'bg-green-400'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Favorite Cuisines */}
        {profile.topCuisines.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Top Cuisines
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.topCuisines.slice(0, 5).map((cuisine, idx) => (
                <div
                  key={cuisine.cuisine}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium',
                    idx === 0
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-neutral-100 text-neutral-700'
                  )}
                >
                  {cuisine.cuisine}
                  <span className="ml-1 text-xs opacity-60">
                    {Math.round(cuisine.score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cooking Style */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <Utensils className="w-4 h-4 text-purple-500" />
            Cooking Style
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="text-xs text-neutral-500 mb-1">Complexity</div>
              <div className="font-medium text-neutral-800 capitalize">
                {summary.cookingStyle.complexity}
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <div className="text-xs text-neutral-500 mb-1">Typical Cook Time</div>
              <div className="font-medium text-neutral-800">
                {summary.cookingStyle.typicalCookTime}
              </div>
            </div>
          </div>
        </div>

        {/* Loved/Disliked Ingredients */}
        {(profile.lovedIngredients.length > 0 || profile.dislikedIngredients.length > 0) && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-neutral-800 mb-3">Ingredient Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              {profile.lovedIngredients.length > 0 && (
                <div>
                  <div className="text-xs text-green-600 mb-2">❤️ Loved</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.lovedIngredients.slice(0, 5).map((ing) => (
                      <span
                        key={ing}
                        className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.dislikedIngredients.length > 0 && (
                <div>
                  <div className="text-xs text-red-600 mb-2">👎 Avoid</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.dislikedIngredients.slice(0, 5).map((ing) => (
                      <span
                        key={ing}
                        className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data points */}
        <div className="mt-6 pt-4 border-t text-center">
          <span className="text-xs text-neutral-400">
            Based on {profile.dataPoints} data points • {Math.round(profile.confidence * 100)}% confidence
          </span>
        </div>
      </div>
    </Card>
  );
}
