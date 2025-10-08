import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateStripeIds() {
  try {
    console.log('Updating tiers with Stripe IDs...');
    
    // Find all tiers without stripePriceId
    const tiers = await prisma.tier.findMany({
      where: { 
        OR: [
          { stripePriceId: null },
          { stripePriceId: '' }
        ]
      },
      include: { product: true }
    });

    console.log(`Found ${tiers.length} tiers without Stripe IDs`);

    // Update each tier with a mock Stripe ID
    for (const tier of tiers) {
      const stripePriceId = `price_${tier.id.substring(0, 10)}`;
      
      await prisma.tier.update({
        where: { id: tier.id },
        data: { stripePriceId }
      });
      
      console.log(`Updated tier ${tier.name} with Stripe ID: ${stripePriceId}`);
    }

    console.log('Stripe IDs updated successfully!');
  } catch (error) {
    console.error('Error updating Stripe IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStripeIds();