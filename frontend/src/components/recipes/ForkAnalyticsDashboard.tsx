import { Link } from 'react-router-dom';
import {
  Loader2,
  GitFork,
  Heart,
  TrendingUp,
  Award,
  BarChart3,
  Tag,
  ChefHat,
} from 'lucide-react';
import { Card } from '../ui';
import { cn } from '../../lib/utils';
import { useForkAnalytics } from '../../hooks';

interface ForkAnalyticsDashboardProps {
  className?: string;
}

export function ForkAnalyticsDashboard({
  className,
}: ForkAnalyticsDashboardProps) {
  const { data: analytics, isLoading, error } = useForkAnalytics();

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className={cn('p-6 text-center text-neutral-500', className)}>
        Failed to load fork analytics
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={GitFork}
          label="Forks Created"
          value={analytics.totalForksCreated}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={TrendingUp}
          label="Forks Received"
          value={analytics.totalForksReceived}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={Heart}
          label="Votes Received"
          value={analytics.totalVotesReceived}
          color="text-rose-600"
          bgColor="bg-rose-100"
        />
        <StatCard
          icon={Award}
          label="Influence Score"
          value={analytics.forkInfluenceScore}
          color="text-amber-600"
          bgColor="bg-amber-100"
        />
      </div>

      {/* Top Forked Recipes */}
      {analytics.topForkedRecipes.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Your Most Forked Recipes
          </h3>

          <div className="space-y-3">
            {analytics.topForkedRecipes.map((recipe, idx) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {/* Rank */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    idx === 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-neutral-100 text-neutral-600',
                  )}
                >
                  {idx + 1}
                </div>

                {/* Image */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-50 to-amber-50 flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-primary-200" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-800 truncate">
                    {recipe.title}
                  </p>
                </div>

                {/* Fork count */}
                <div className="flex items-center gap-1 text-sm text-neutral-500">
                  <GitFork className="w-4 h-4" />
                  {recipe.forkCount}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Fork Tags Used */}
      {analytics.topForkTags.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-500" />
            Your Fork Categories
          </h3>

          <div className="flex flex-wrap gap-2">
            {analytics.topForkTags.map((tagData) => (
              <div
                key={tagData.tag}
                className="px-3 py-1.5 bg-neutral-100 rounded-full text-sm"
              >
                <span className="font-medium text-neutral-800">
                  {formatTagLabel(tagData.tag)}
                </span>
                <span className="ml-2 text-neutral-500">×{tagData.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Activity Chart Placeholder */}
      {analytics.forkActivityByMonth.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            Fork Activity
          </h3>

          <div className="h-40 flex items-end gap-2">
            {analytics.forkActivityByMonth.map((month) => {
              const maxHeight = Math.max(
                ...analytics.forkActivityByMonth.map((m) => m.forksCreated),
                1,
              );
              const height = (month.forksCreated / maxHeight) * 100;

              return (
                <div
                  key={month.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-primary-400 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-neutral-500 mt-2">
                    {month.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {analytics.totalForksCreated === 0 &&
        analytics.totalForksReceived === 0 && (
          <Card className="p-8 text-center">
            <GitFork className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
            <h3 className="font-medium text-neutral-700 mb-2">
              No fork activity yet
            </h3>
            <p className="text-sm text-neutral-500">
              Fork recipes to create your own variations, or share your recipes
              for others to fork!
            </p>
          </Card>
        )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            bgColor,
          )}
        >
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
