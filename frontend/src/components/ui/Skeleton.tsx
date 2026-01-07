import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-primary-200/60',
        className
      )}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-primary-100 shadow-soft overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] rounded-none" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RecipeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FlavorDNASkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-primary-100/50 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-primary-100/50">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Circular meters */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-primary-100/50 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-28 rounded-xl" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <FlavorDNASkeleton />

          {/* Recent Recipes */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <RecipeCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Card */}
          <Skeleton className="h-64 rounded-3xl" />

          {/* Pantry Alerts */}
          <div className="bg-white rounded-2xl border border-primary-100/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="text-center py-6 space-y-3">
              <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
              <Skeleton className="h-9 w-28 mx-auto rounded-lg" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
