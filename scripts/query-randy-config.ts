import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function queryRandyConfig() {
  try {
    console.log('Querying WhiteLabelConfig for subdomain "randy-kendel"...');
    
    const config = await prisma.whiteLabelConfig.findFirst({
      where: { subdomain: 'randy-kendel' },
      include: {
        saasCreator: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            products: {
              where: { isActive: true },
              include: {
                tiers: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    });

    if (config) {
      console.log('Found config:', {
        id: config.id,
        saasCreatorId: config.saasCreatorId,
        subdomain: config.subdomain,
        isActive: config.isActive,
        saasCreator: {
          id: config.saasCreator.id,
          businessName: config.saasCreator.businessName,
          user: config.saasCreator.user,
          products: config.saasCreator.products.map(p => ({
            id: p.id,
            name: p.name,
            isActive: p.isActive,
            tiers: p.tiers.map(t => ({ id: t.id, name: t.name, isActive: t.isActive }))
          }))
        }
      });
    } else {
      console.log('No WhiteLabelConfig found for subdomain "randy-kendel"');
    }

    // Also query the test product directly
    const testProductId = 'cmgjrx0xx000b11zjxt7mg2d8';
    const testProduct = await prisma.product.findUnique({
      where: { id: testProductId },
      include: {
        saasCreator: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            whiteLabelConfig: true
          }
        },
        tiers: { where: { isActive: true } }
      }
    });

    if (testProduct) {
      console.log('Test product details:', {
        id: testProduct.id,
        name: testProduct.name,
        saasCreatorId: testProduct.saasCreatorId,
        saasCreator: {
          id: testProduct.saasCreator.id,
          businessName: testProduct.saasCreator.businessName,
          user: testProduct.saasCreator.user,
          whiteLabelConfig: testProduct.saasCreator.whiteLabelConfig ? {
            id: testProduct.saasCreator.whiteLabelConfig.id,
            subdomain: testProduct.saasCreator.whiteLabelConfig.subdomain
          } : null
        },
        tiers: testProduct.tiers.map(t => ({ id: t.id, name: t.name, isActive: t.isActive }))
      });
    } else {
      console.log('Test product not found');
    }

  } catch (error) {
    console.error('Query error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryRandyConfig();