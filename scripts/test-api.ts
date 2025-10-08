import { PrismaClient } from '@prisma/client';

// Simulate the API endpoint logic directly
const prisma = new PrismaClient();

async function testApiEndpoint() {
  try {
    console.log('Testing API endpoint logic...');
    
    // Find platform owner and their products with tiers
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

    console.log('Platform owner query result:', platformOwner ? 'Found' : 'Not found');

    // If no platform owner exists, return empty tiers array instead of 404
    if (!platformOwner) {
      console.log('Result: { tiers: [] }');
      return { tiers: [] };
    }

    // If platform owner exists but hasn't completed onboarding, return empty tiers
    if (!platformOwner.saasCreator) {
      console.log('Result: { tiers: [] }');
      return { tiers: [] };
    }

    // Flatten and transform products and tiers
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

    console.log('Result:', { tiers: allTiers });
    console.log(`Found ${allTiers.length} tiers`);
    
    if (allTiers.length > 0) {
      console.log('Sample tier:', allTiers[0]);
    }
    
    return { tiers: allTiers };
  } catch (error) {
    console.error('Error in API endpoint logic:', error);
    return { error: 'Failed to fetch tiers' };
  } finally {
    await prisma.$disconnect();
  }
}

testApiEndpoint();