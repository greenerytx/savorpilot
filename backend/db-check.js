require('dotenv').config();
const { PrismaClient } = require('.prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Mohamad Raad's ID
  const mohamadId = 'fc73c34f-3aac-47a6-bf67-4b41fbcde3b8';
  // Mo Raad's ID
  const moId = 'abe97528-27dd-4731-b413-bc6caa4c5fcf';

  console.log('=== CHECKING FOLLOW STATUS ===');
  const follows = await prisma.userFollow.findMany({
    where: {
      OR: [
        { followerId: mohamadId },
        { followeeId: mohamadId }
      ]
    }
  });
  console.log('Follows involving Mohamad:', JSON.stringify(follows, null, 2));

  console.log('\n=== SIMULATING getFollowSuggestions for Mohamad ===');

  // Get users Mohamad is following
  const following = await prisma.userFollow.findMany({
    where: { followerId: mohamadId },
    select: { followeeId: true },
  });
  const followingIds = following.map(f => f.followeeId);
  console.log('Mohamad is following:', followingIds);

  // The actual query
  const suggestions = await prisma.user.findMany({
    where: {
      id: { notIn: [mohamadId, ...followingIds] },
      status: 'ACTIVE',
      recipes: {
        some: { visibility: 'PUBLIC' },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
  console.log('\nSuggestions found:', JSON.stringify(suggestions, null, 2));

  // Check Mo Raad's public recipes count
  const moPublicRecipes = await prisma.recipe.count({
    where: { userId: moId, visibility: 'PUBLIC' }
  });
  console.log('\nMo Raad public recipes:', moPublicRecipes);

  // Check Mo Raad's status
  const moUser = await prisma.user.findUnique({
    where: { id: moId },
    select: { id: true, firstName: true, status: true }
  });
  console.log('Mo Raad user:', JSON.stringify(moUser, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
