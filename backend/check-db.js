const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

(async () => {
  const publicRecipes = await p.recipe.findMany({
    where: { visibility: 'PUBLIC' },
    select: { id: true, title: true, userId: true }
  });
  console.log('PUBLIC recipes:', publicRecipes.length);
  console.log(publicRecipes.slice(0, 5));

  const allRecipes = await p.recipe.findMany({
    select: { visibility: true }
  });
  console.log('\nAll recipes by visibility:');
  const counts = {};
  allRecipes.forEach(r => {
    counts[r.visibility] = (counts[r.visibility] || 0) + 1;
  });
  console.log(counts);

  const users = await p.user.findMany({
    select: { id: true, firstName: true, status: true }
  });
  console.log('\nTotal users:', users.length);
  console.log(users);

  await p.$disconnect();
})();
