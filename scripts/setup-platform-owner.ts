import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * NOTE: For a complete platform owner setup with Stripe integration,
 * use setup-full-platform-owner.ts instead:
 *   npx tsx scripts/setup-full-platform-owner.ts
 * 
 * This script creates products without Stripe integration.
 */
async function setupPlatformOwner() {
  try {
    // Find the platform owner
    const platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' }
    });

    if (!platformOwner) {
      console.log('No platform owner found');
      return;
    }

    console.log('Found platform owner:', platformOwner.email);

    // Check if SaaS creator profile exists
    let saasCreator = await prisma.saasCreator.findUnique({
      where: { userId: platformOwner.id }
    });

    if (!saasCreator) {
      // Create SaaS creator profile
      saasCreator = await prisma.saasCreator.create({
        data: {
          userId: platformOwner.id,
          businessName: 'Platform Business',
          businessDescription: 'Main platform business',
          website: 'https://example.com',
          onboardingCompleted: true,
          onboardingStep: 4
        }
      });
      console.log('Created SaaS creator profile');
    } else {
      console.log('SaaS creator profile already exists');
    }

    // Check if products exist
    const productCount = await prisma.product.count({
      where: { saasCreatorId: saasCreator.id }
    });

    if (productCount === 0) {
      // Create sample products
      const product1 = await prisma.product.create({
        data: {
          saasCreatorId: saasCreator.id,
          name: 'Starter Plan',
          description: 'Perfect for small businesses getting started',
          isActive: true
        }
      });

      const product2 = await prisma.product.create({
        data: {
          saasCreatorId: saasCreator.id,
          name: 'Professional Plan',
          description: 'For growing businesses with advanced needs',
          isActive: true
        }
      });

      console.log('Created products:', product1.name, product2.name);

      // Create tiers for products
      const tier1 = await prisma.tier.create({
        data: {
          productId: product1.id,
          name: 'Basic',
          description: 'Basic features',
          priceAmount: 2900, // $29.00
          billingPeriod: 'monthly',
          features: ['Up to 5 users', 'Basic support', '1GB storage'],
          usageLimit: 100,
          isActive: true,
          sortOrder: 1
        }
      });

      const tier2 = await prisma.tier.create({
        data: {
          productId: product1.id,
          name: 'Premium',
          description: 'Premium features',
          priceAmount: 5900, // $59.00
          billingPeriod: 'monthly',
          features: ['Up to 20 users', 'Priority support', '10GB storage', 'Advanced analytics'],
          usageLimit: 500,
          isActive: true,
          sortOrder: 2
        }
      });

      const tier3 = await prisma.tier.create({
        data: {
          productId: product2.id,
          name: 'Business',
          description: 'Business features',
          priceAmount: 9900, // $99.00
          billingPeriod: 'monthly',
          features: ['Unlimited users', '24/7 support', '100GB storage', 'Advanced analytics', 'Custom integrations'],
          usageLimit: 10000,
          isActive: true,
          sortOrder: 1
        }
      });

      console.log('Created tiers:', tier1.name, tier2.name, tier3.name);
    } else {
      console.log('Products already exist');
    }

    console.log('Platform owner setup complete!');
  } catch (error) {
    console.error('Error setting up platform owner:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPlatformOwner();