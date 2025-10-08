import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database state...');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    // Check platform owner
    const platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' },
      include: { saasCreator: true }
    });
    
    if (platformOwner) {
      console.log('\nPlatform owner found:');
      console.log(`  Email: ${platformOwner.email}`);
      console.log(`  Role: ${platformOwner.role}`);
      
      if (platformOwner.saasCreator) {
        console.log(`  SaaS Creator ID: ${platformOwner.saasCreator.id}`);
        console.log(`  Business Name: ${platformOwner.saasCreator.businessName}`);
        console.log(`  Onboarding Completed: ${platformOwner.saasCreator.onboardingCompleted}`);
        
        // Check products
        const products = await prisma.product.findMany({
          where: { saasCreatorId: platformOwner.saasCreator.id },
          include: { tiers: true }
        });
        
        console.log(`\nFound ${products.length} products:`);
        products.forEach(product => {
          console.log(`  - ${product.name}: ${product.description}`);
          console.log(`    Tiers: ${product.tiers.length}`);
          product.tiers.forEach(tier => {
            console.log(`      * ${tier.name} - $${tier.priceAmount/100}`);
          });
        });
      } else {
        console.log('  No SaaS creator profile found');
      }
    } else {
      console.log('\nNo platform owner found');
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();