import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RecipesModule } from './recipes/recipes.module';
import { GroupsModule } from './groups/groups.module';
import { AiModule } from './ai/ai.module';
import { SharingModule } from './sharing/sharing.module';
import { SmartCollectionsModule } from './smart-collections/smart-collections.module';
import { InstagramModule } from './instagram/instagram.module';
import { ExtensionModule } from './extension/extension.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ImageProxyModule } from './image-proxy/image-proxy.module';
import { UsersModule } from './users/users.module';
import { YouTubeModule } from './youtube/youtube.module';
import { FlavorDnaModule } from './flavor-dna/flavor-dna.module';
import { ForkEnhancementsModule } from './fork-enhancements/fork-enhancements.module';
import { UrlImportModule } from './url-import/url-import.module';
import { DinnerCirclesModule } from './dinner-circles/dinner-circles.module';
import { MealPlanningModule } from './meal-planning/meal-planning.module';
import { ShoppingModule } from './shopping/shopping.module';
import { PartyEventsModule } from './party-events/party-events.module';
import { SocialModule } from './social/social.module';
import { RecipeCommentsModule } from './recipe-comments/recipe-comments.module';
import { CookingPostsModule } from './cooking-posts/cooking-posts.module';
import { ActivityFeedModule } from './activity-feed/activity-feed.module';
import { ChallengesModule } from './challenges/challenges.module';
import { RecipeReactionsModule } from './recipe-reactions/recipe-reactions.module';
import { SubstitutionsModule } from './substitutions/substitutions.module';
import { CookingStatusModule } from './cooking-status/cooking-status.module';
import { RecipeRequestsModule } from './recipe-requests/recipe-requests.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { GroceryModule } from './grocery/grocery.module';
import { SocialPostsModule } from './social-posts/social-posts.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RecipesModule,
    GroupsModule,
    AiModule,
    SharingModule,
    SmartCollectionsModule,
    InstagramModule,
    ExtensionModule,
    NotificationsModule,
    ImageProxyModule,
    YouTubeModule,
    FlavorDnaModule,
    ForkEnhancementsModule,
    UrlImportModule,
    DinnerCirclesModule,
    MealPlanningModule,
    ShoppingModule,
    PartyEventsModule,
    SocialModule,
    RecipeCommentsModule,
    CookingPostsModule,
    ActivityFeedModule,
    ChallengesModule,
    RecipeReactionsModule,
    SubstitutionsModule,
    CookingStatusModule,
    RecipeRequestsModule,
    NutritionModule,
    GroceryModule,
    SocialPostsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
