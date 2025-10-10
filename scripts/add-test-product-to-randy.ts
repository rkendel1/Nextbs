import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestProductToRandy() {
  try {
    console.log('Finding WhiteLabelConfig for "s"...');
    
    const config = await prisma.whiteLabelConfig.findFirst({
      where: { subdomain: 's', isActive: true }
    });

    if (!config) {
      console.log('No active config found for s');
      return;
    }

    const saasCreatorId = config.saasCreatorId;
    console.log('Using saasCreatorId:', saasCreatorId);

    // Upsert test product
    const testProductId = 'cmgjs22an000i11zjcvpwpkc2';
    const testProduct = await prisma.product.upsert({
      where: { id: testProductId },
      update: {
        saasCreatorId: saasCreatorId,
        name: 'Test Product',
        description: 'Example product that should display on the products page',
        isActive: true
      },
      create: {
        id: testProductId,
        saasCreatorId: saasCreatorId,
        name: 'Test Product',
        description: 'Example product that should display on the products page',
        isActive: true
      }
    });
    console.log('Upserted test product:', testProduct.id);

    // Add basic tier if not exists
    const tierData = {
      productId: testProduct.id,
      name: 'Basic',
      description: 'Basic access to the product',
      priceAmount: 0,
      billingPeriod: 'monthly',
      features: ['Embed access', 'Basic features'],
      isActive: true,
      sortOrder: 1
    };

    let basicTier = await prisma.tier.findFirst({
      where: { productId: testProduct.id, name: 'Basic' }
    });

    if (!basicTier) {
      basicTier = await prisma.tier.create({
        data: tierData
      });
      console.log('Created basic tier:', basicTier.id);
    } else {
      basicTier = await prisma.tier.update({
        where: { id: basicTier.id },
        data: tierData
      });
      console.log('Updated basic tier:', basicTier.id);
    }

    console.log('Test product added to randy-kendel creator successfully!');
  } catch (error) {
    console.error('Error adding test product:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestProductToRandy();