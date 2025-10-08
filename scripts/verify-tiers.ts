import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTiers() {
  try {
    console.log('Verifying tiers and Stripe IDs...');
    
    // Find all tiers
    const tiers = await prisma.tier.findMany({
      include: { 
        product: {
          include: {
            saasCreator: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${tiers.length} tiers:`);
    
    for (const tier of tiers) {
      console.log(`\nTier: ${tier.name}`);
      console.log(`  ID: ${tier.id}`);
      console.log(`  Stripe Price ID: ${tier.stripePriceId || 'MISSING'}`);
      console.log(`  Price Amount: $${tier.priceAmount/100}`);
      console.log(`  Is Active: ${tier.isActive}`);
      console.log(`  Product: ${tier.product.name}`);
      console.log(`  Creator: ${tier.product.saasCreator.user.email}`);
    }

    // Check what the API would return
    const platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' },
      include: {
        saasCreator: {
          include: {
            products: {
              where: { isActive: true },
              include: {
                tiers: {
                  where: {
                    isActive: true,
                    stripePriceId: { not: null }
                  },
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (platformOwner?.saasCreator) {
      const allTiers = platformOwner.saasCreator.products.flatMap(product => 
        product.tiers.map(tier => ({
          id: tier.stripePriceId,
          nickname: tier.name,
          unit_amount: tier.priceAmount,
          offers: tier.features,
          product: {
            name: product.name,
            description: product.description || tier.description,
          },
          isActive: tier.isActive,
          stripePriceId: tier.stripePriceId
        }))
      );
      
      console.log(`\nAPI would return ${allTiers.length} tiers:`);
      for (const tier of allTiers) {
        console.log(`  - ${tier.nickname}: $${tier.unit_amount/100} (${tier.id})`);
      }
    } else {
      console.log('\nNo platform owner with completed onboarding found');
    }
  } catch (error) {
    console.error('Error verifying tiers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTiers();