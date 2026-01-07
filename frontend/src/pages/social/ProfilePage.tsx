import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChefHat, Users, Calendar, Loader2, Clock, GitFork } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge } from '../../components/ui';
import { FollowButton, UserCard } from '../../components/social';
import {
  useUserProfile,
  useUserFollowers,
  useUserFollowing,
  getFullName,
  getInitials,
  formatFollowerCount,
  getMemberSinceText,
} from '../../hooks/useSocial';
import { publicService } from '../../services/public.service';
import { useAuthStore } from '../../stores/authStore';
import { cn, getImageUrl } from '../../lib/utils';

type Tab = 'recipes' | 'followers' | 'following';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('recipes');
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading: profileLoading, error: profileError } = useUserProfile(userId || '');
  const { data: followers, isLoading: followersLoading } = useUserFollowers(userId || '');
  const { data: following, isLoading: followingLoading } = useUserFollowing(userId || '');
  const { data: recipesData, isLoading: recipesLoading } = useQuery({
    queryKey: ['chef-recipes', userId],
    queryFn: () => publicService.getChefRecipes(userId!),
    enabled: !!userId && activeTab === 'recipes',
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <p className="text-neutral-600">User not found</p>
        </Card>
      </div>
    );
  }

  const fullName = getFullName(profile);
  const initials = getInitials(profile);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'recipes', label: 'Recipes', count: profile.recipeCount },
    { id: 'followers', label: 'Followers', count: profile.followerCount },
    { id: 'following', label: 'Following', count: profile.followingCount },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={fullName}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary-100 flex items-center justify-center text-3xl sm:text-4xl font-medium text-primary-700">
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-neutral-900">{fullName}</h1>
              {!isOwnProfile && (
                <div className="flex justify-center sm:justify-start">
                  <FollowButton
                    userId={profile.id}
                    isFollowing={profile.isFollowing}
                    userName={fullName}
                  />
                </div>
              )}
              {isOwnProfile && (
                <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">
                  This is you
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-6 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">{formatFollowerCount(profile.recipeCount)}</p>
                <p className="text-sm text-neutral-500">Recipes</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">{formatFollowerCount(profile.followerCount)}</p>
                <p className="text-sm text-neutral-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">{formatFollowerCount(profile.followingCount)}</p>
                <p className="text-sm text-neutral-500">Following</p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {getMemberSinceText(profile.createdAt)}
              </span>
              {profile.isFollowedBy && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  Follows you
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600'
              )}>
                {formatFollowerCount(tab.count)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          {recipesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : recipesData?.recipes?.data && recipesData.recipes.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipesData.recipes.data.map((recipe) => (
                <Link key={recipe.id} to={`/recipes/${recipe.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {recipe.imageUrl ? (
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={getImageUrl(recipe.imageUrl)}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-neutral-900 line-clamp-1 mb-1">
                        {recipe.title}
                      </h3>
                      {recipe.description && (
                        <p className="text-sm text-neutral-500 line-clamp-2 mb-2">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {recipe.cuisine && (
                          <Badge variant="secondary" className="text-xs">{recipe.cuisine}</Badge>
                        )}
                        {recipe.category && (
                          <Badge variant="outline" className="text-xs">{recipe.category}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
                          </span>
                        )}
                        {recipe.forkCount > 0 && (
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" />
                            {recipe.forkCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ChefHat className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-600">No public recipes yet</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="space-y-3">
          {followersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : followers && followers.data.length > 0 ? (
            followers.data.map((user) => (
              <UserCard key={user.id} user={user} variant="compact" />
            ))
          ) : (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-600">No followers yet</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div className="space-y-3">
          {followingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : following && following.data.length > 0 ? (
            following.data.map((user) => (
              <UserCard key={user.id} user={user} variant="compact" />
            ))
          ) : (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-600">Not following anyone yet</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
