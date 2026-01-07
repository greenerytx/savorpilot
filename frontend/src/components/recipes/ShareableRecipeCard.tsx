import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, Users, ChefHat } from 'lucide-react';
import { getImageUrl, cn } from '../../lib/utils';
import type { Recipe } from '../../types/recipe';

export type CardStyle = 'classic' | 'pinterest' | 'modern' | 'minimal';

interface ShareableRecipeCardProps {
  recipe: Recipe;
  style: CardStyle;
  showQR?: boolean;
  qrUrl?: string;
  imageDataUrl?: string | null; // Base64 image to avoid CORS issues
}

export const ShareableRecipeCard = forwardRef<HTMLDivElement, ShareableRecipeCardProps>(
  ({ recipe, style, showQR = true, qrUrl, imageDataUrl }, ref) => {
    const recipeUrl = qrUrl || `${window.location.origin}/recipes/${recipe.id}`;
    const totalTime = recipe.totalTimeMinutes ||
      ((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0));
    const ingredientCount = recipe.components?.reduce(
      (sum, c) => sum + (c.ingredients?.length || 0), 0
    ) || 0;

    // Use base64 image if provided, otherwise fall back to URL
    const displayImageUrl = imageDataUrl || getImageUrl(recipe.imageUrl);

    // Style-specific rendering
    switch (style) {
      case 'classic':
        return (
          <div
            ref={ref}
            className="w-[600px] bg-white rounded-xl shadow-lg overflow-hidden"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {/* Header Image */}
            <div className="h-64 bg-gradient-to-br from-amber-100 to-orange-100 relative overflow-hidden">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-24 h-24 text-amber-300" />
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Category badge */}
              {recipe.category && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 rounded-full text-sm font-medium text-amber-700">
                  {recipe.category.replace('_', ' ')}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {recipe.title}
              </h2>

              {recipe.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {recipe.description}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                {totalTime > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{totalTime} min</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>{recipe.servings} servings</span>
                </div>
                {ingredientCount > 0 && (
                  <span>{ingredientCount} ingredients</span>
                )}
              </div>

              {/* Tags */}
              {recipe.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer with QR */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">GG</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Get the recipe at</p>
                    <p className="text-sm font-medium text-amber-600">GramGrab</p>
                  </div>
                </div>

                {showQR && (
                  <div className="p-1 bg-white rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={recipeUrl}
                      size={64}
                      level="M"
                      fgColor="#78350f"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'pinterest':
        return (
          <div
            ref={ref}
            className="w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            {/* Tall Image */}
            <div className="h-[400px] bg-gradient-to-br from-rose-100 to-pink-100 relative overflow-hidden">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-20 h-20 text-rose-300" />
                </div>
              )}

              {/* Top gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

              {/* Category pill */}
              {recipe.category && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-rose-600 shadow-md">
                  {recipe.category.replace('_', ' ')}
                </div>
              )}

              {/* Time badge */}
              {totalTime > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {totalTime} min
                </div>
              )}

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-lg">
                  {recipe.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {recipe.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {recipe.description}
                </p>
              )}

              {/* Quick info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {recipe.servings}
                </span>
                {ingredientCount > 0 && (
                  <span>{ingredientCount} ingredients</span>
                )}
                {recipe.difficulty && (
                  <span className="capitalize">{recipe.difficulty.toLowerCase()}</span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">GG</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">GramGrab</span>
                </div>

                {showQR && (
                  <QRCodeSVG
                    value={recipeUrl}
                    size={48}
                    level="M"
                    fgColor="#be185d"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'modern':
        return (
          <div
            ref={ref}
            className="w-[600px] bg-gray-900 rounded-2xl overflow-hidden"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            <div className="flex">
              {/* Image side */}
              <div className="w-1/2 h-80 relative overflow-hidden">
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-white/50" />
                  </div>
                )}
              </div>

              {/* Content side */}
              <div className="w-1/2 p-6 flex flex-col justify-between">
                <div>
                  {recipe.category && (
                    <span className="text-violet-400 text-xs font-semibold uppercase tracking-wider">
                      {recipe.category.replace('_', ' ')}
                    </span>
                  )}

                  <h2 className="text-xl font-bold text-white mt-2 mb-3 leading-tight">
                    {recipe.title}
                  </h2>

                  {recipe.description && (
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                      {recipe.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {totalTime > 0 && (
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-2xl font-bold text-white">{totalTime}</p>
                        <p className="text-xs text-gray-400">minutes</p>
                      </div>
                    )}
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">{recipe.servings}</p>
                      <p className="text-xs text-gray-400">servings</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">GG</span>
                    </div>
                    <span className="text-sm text-gray-400">GramGrab</span>
                  </div>

                  {showQR && (
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeSVG
                        value={recipeUrl}
                        size={48}
                        level="M"
                        fgColor="#7c3aed"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'minimal':
        return (
          <div
            ref={ref}
            className="w-[500px] bg-stone-50 p-8"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {/* Decorative top */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-0.5 bg-stone-300" />
            </div>

            {/* Category */}
            {recipe.category && (
              <p className="text-center text-stone-400 text-xs uppercase tracking-[0.3em] mb-4">
                {recipe.category.replace('_', ' ')}
              </p>
            )}

            {/* Title */}
            <h2 className="text-3xl text-center text-stone-800 mb-4 leading-tight">
              {recipe.title}
            </h2>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-px bg-stone-300" />
              <ChefHat className="w-5 h-5 text-stone-400" />
              <div className="w-8 h-px bg-stone-300" />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-sm text-stone-500 mb-6">
              {totalTime > 0 && (
                <div className="text-center">
                  <p className="text-xl font-light text-stone-700">{totalTime}</p>
                  <p className="text-xs uppercase tracking-wider">minutes</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xl font-light text-stone-700">{recipe.servings}</p>
                <p className="text-xs uppercase tracking-wider">servings</p>
              </div>
              {ingredientCount > 0 && (
                <div className="text-center">
                  <p className="text-xl font-light text-stone-700">{ingredientCount}</p>
                  <p className="text-xs uppercase tracking-wider">ingredients</p>
                </div>
              )}
            </div>

            {recipe.description && (
              <p className="text-center text-stone-600 text-sm italic mb-6 max-w-sm mx-auto">
                "{recipe.description}"
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-stone-200">
              <p className="text-xs text-stone-400">
                gramgrab.com
              </p>

              {showQR && (
                <QRCodeSVG
                  value={recipeUrl}
                  size={48}
                  level="M"
                  fgColor="#78716c"
                  bgColor="#fafaf9"
                />
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  }
);

ShareableRecipeCard.displayName = 'ShareableRecipeCard';

export default ShareableRecipeCard;
