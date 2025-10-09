import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPlatformComplete() {
  try {
    // Step 1: Find or create platform owner user
    let platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' }
    });

    if (!platformOwner) {
      console.log('No platform owner found, creating one...');
      platformOwner = await prisma.user.create({
        data: {
          name: 'Platform Owner',
          email: 'platform@nextbs.com',
          role: 'platform_owner',
          subscriptionStatus: 'FREE'
        }
      });
      console.log('Created platform owner user:', platformOwner.email);
    } else {
      console.log('Platform owner user already exists:', platformOwner.email);
    }

    // Step 2: Create SaasCreator if missing
    let saasCreator = await prisma.saasCreator.findUnique({
      where: { userId: platformOwner.id }
    });

    if (!saasCreator) {
      saasCreator = await prisma.saasCreator.create({
        data: {
          userId: platformOwner.id,
          businessName: 'Platform Business',
          businessDescription: 'Main platform business for testing and setup',
          website: 'https://nextbs.com',
          onboardingCompleted: true,
          onboardingStep: 4,
          crawlStatus: 'completed'
        }
      });
      console.log('Created SaasCreator profile');
    } else {
      console.log('SaasCreator profile already exists');
    }

    // Step 3: Create active product if none exist
    const productCount = await prisma.product.count({
      where: { saasCreatorId: saasCreator.id, isActive: true }
    });

    if (productCount === 0) {
      const product = await prisma.product.create({
        data: {
          saasCreatorId: saasCreator.id,
          name: 'Platform Product',
          description: 'Active platform product for testing subscriptions and features',
          isActive: true
        }
      });
      console.log('Created active product:', product.name);

      // Optional: Create a basic tier for the product
      await prisma.tier.create({
        data: {
          productId: product.id,
          name: 'Basic',
          description: 'Basic tier for platform product',
          priceAmount: 0, // Free tier
          billingPeriod: 'monthly',
          features: ['Platform access', 'Basic support'],
          isActive: true,
          sortOrder: 1
        }
      });
      console.log('Created basic tier for the product');
    } else {
      console.log('Active product already exists');
    }

    // Step 4: Setup test whitelabel creator for randy-kendel
    console.log('Setting up test whitelabel creator for randy-kendel...');

    // Find or create randy user
    let randyUser = await prisma.user.findFirst({
      where: { email: 'randy@example.com' }
    });

    if (!randyUser) {
      randyUser = await prisma.user.create({
        data: {
          name: 'Randy Kendel',
          email: 'randy@example.com',
          role: 'creator',
          subscriptionStatus: 'FREE'
        }
      });
      console.log('Created randy user:', randyUser.email);
    } else {
      console.log('Randy user already exists');
    }

    // Create SaasCreator for randy
    let randyCreator = await prisma.saasCreator.findUnique({
      where: { userId: randyUser.id }
    });

    if (!randyCreator) {
      randyCreator = await prisma.saasCreator.create({
        data: {
          userId: randyUser.id,
          businessName: 'Randy Kendel',
          businessDescription: 'Test whitelabel SaaS business',
          website: 'https://randy-kendel.com',
          onboardingCompleted: true,
          onboardingStep: 4,
          crawlStatus: 'completed',
          primaryColor: '#667eea',
          secondaryColor: '#f5f5f5',
          logoUrl: '/images/logo/logo.svg'
        }
      });
      console.log('Created randy SaasCreator');
    } else {
      console.log('Randy SaasCreator already exists');
    }

    // Upsert WhiteLabelConfig for randy-kendel subdomain
    let whiteLabelConfig = await prisma.whiteLabelConfig.upsert({
      where: { saasCreatorId: randyCreator.id },
      update: {
        brandName: 'Randy Kendel',
        primaryColor: '#667eea',
        secondaryColor: '#f5f5f5',
        logoUrl: '/images/logo/logo.svg',
        faviconUrl: '/images/logo/favicon.svg',
        subdomain: 'randy-kendel',
        isActive: true
      },
      create: {
        saasCreatorId: randyCreator.id,
        brandName: 'Randy Kendel',
        primaryColor: '#667eea',
        secondaryColor: '#f5f5f5',
        logoUrl: '/images/logo/logo.svg',
        faviconUrl: '/images/logo/favicon.svg',
        subdomain: 'randy-kendel',
        isActive: true
      }
    });
    console.log('Upserted whiteLabelConfig for randy-kendel');

    // Create test product for randy
    const testProductId = 'cmgjrx0xx000b11zjxt7mg2d8';
    let testProduct = await prisma.product.findUnique({
      where: { id: testProductId }
    });

    if (!testProduct || testProduct.saasCreatorId !== randyCreator.id) {
      testProduct = await prisma.product.upsert({
        where: { id: testProductId },
        update: {
          saasCreatorId: randyCreator.id,
          name: 'Test Product',
          description: 'Example product that should display on the products page',
          isActive: true
        },
        create: {
          id: testProductId,
          saasCreatorId: randyCreator.id,
          name: 'Test Product',
          description: 'Example product that should display on the products page',
          isActive: true
        }
      });
      console.log('Upserted test product:', testProduct.name);

      // Create or update a basic tier for the test product
      const tierData = {
        productId: testProduct.id,
        name: 'Basic',
        description: 'Basic access to the product',
        priceAmount: 0, // Free tier
        billingPeriod: 'monthly',
        features: ['Embed access', 'Basic features'],
        isActive: true,
        sortOrder: 1
      };

      let basicTier = await prisma.tier.findFirst({
        where: { productId: testProduct.id, name: 'Basic' }
      });

      if (!basicTier) {
        await prisma.tier.create({
          data: tierData
        });
        console.log('Created basic tier for test product');
      } else {
        await prisma.tier.update({
          where: { id: basicTier.id },
          data: tierData
        });
        console.log('Updated basic tier for test product');
      }
    } else {
      console.log('Test product already exists and linked correctly');
    }

    console.log('Test whitelabel setup for randy-kendel finished successfully!');
    console.log('Platform complete setup finished successfully!');
  } catch (error) {
    console.error('Error in platform setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPlatformComplete();