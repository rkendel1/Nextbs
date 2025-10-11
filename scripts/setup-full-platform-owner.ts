import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Check if Stripe is configured
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

interface ProductConfig {
  name: string;
  description: string;
  tiers: TierConfig[];
}

interface TierConfig {
  name: string;
  description: string;
  priceAmount: number; // in cents
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  usageLimit?: number;
  sortOrder: number;
}

const PRODUCTS_CONFIG: ProductConfig[] = [
  {
    name: 'Starter Plan',
    description: 'Perfect for small businesses and individuals getting started with our platform',
    tiers: [
      {
        name: 'Basic',
        description: 'Essential features for getting started',
        priceAmount: 2900, // $29/month
        billingPeriod: 'monthly',
        features: [
          'Up to 5 users',
          'Basic support',
          '1GB storage',
          'Core features access',
          'Email support'
        ],
        usageLimit: 100,
        sortOrder: 1
      }
    ]
  },
  {
    name: 'Professional Plan',
    description: 'Advanced features for growing businesses and teams',
    tiers: [
      {
        name: 'Professional',
        description: 'Enhanced capabilities for professional teams',
        priceAmount: 5900, // $59/month
        billingPeriod: 'monthly',
        features: [
          'Up to 20 users',
          'Priority support',
          '10GB storage',
          'Advanced analytics',
          'API access',
          'Custom integrations'
        ],
        usageLimit: 500,
        sortOrder: 1
      }
    ]
  },
  {
    name: 'Enterprise Plan',
    description: 'Comprehensive solution for large organizations with advanced needs',
    tiers: [
      {
        name: 'Enterprise',
        description: 'Full-featured plan for enterprise organizations',
        priceAmount: 9900, // $99/month
        billingPeriod: 'monthly',
        features: [
          'Unlimited users',
          '24/7 dedicated support',
          '100GB storage',
          'Advanced analytics & reporting',
          'Custom integrations',
          'SSO & advanced security',
          'Dedicated account manager',
          'SLA guarantee'
        ],
        usageLimit: 10000,
        sortOrder: 1
      }
    ]
  }
];

async function setupFullPlatformOwner() {
  try {
    console.log('🚀 Starting full platform owner setup...\n');

    // Step 1: Find or create platform owner user
    let platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' }
    });

    if (!platformOwner) {
      console.log('📝 Creating platform owner user...');
      platformOwner = await prisma.user.create({
        data: {
          name: 'Platform Owner',
          email: 'platform@nextbs.com',
          role: 'platform_owner',
          subscriptionStatus: 'FREE'
        }
      });
      console.log('✅ Created platform owner user:', platformOwner.email);
    } else {
      console.log('✅ Platform owner user already exists:', platformOwner.email);
    }

    // Step 2: Create or verify SaasCreator profile
    let saasCreator = await prisma.saasCreator.findUnique({
      where: { userId: platformOwner.id }
    });

    if (!saasCreator) {
      console.log('📝 Creating SaasCreator profile...');
      saasCreator = await prisma.saasCreator.create({
        data: {
          userId: platformOwner.id,
          businessName: 'Platform Business',
          businessDescription: 'Main platform business providing SaaS solutions',
          website: 'https://nextbs.com',
          onboardingCompleted: true,
          onboardingStep: 4,
          crawlStatus: 'completed'
        }
      });
      console.log('✅ Created SaasCreator profile');
    } else {
      console.log('✅ SaasCreator profile already exists');
      // Update to ensure onboarding is complete
      await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: 4,
          crawlStatus: 'completed'
        }
      });
    }

    // Step 3: Create products and tiers with Stripe integration
    console.log('\n📦 Setting up products and tiers...');
    
    for (const productConfig of PRODUCTS_CONFIG) {
      console.log(`\n  Processing: ${productConfig.name}`);
      
      // Check if product already exists
      let product = await prisma.product.findFirst({
        where: {
          saasCreatorId: saasCreator.id,
          name: productConfig.name
        }
      });

      if (!product) {
        // Create Stripe product if Stripe is configured
        let stripeProductId: string | undefined;
        if (stripe) {
          try {
            console.log(`    Creating Stripe product...`);
            const stripeProduct = await stripe.products.create({
              name: productConfig.name,
              description: productConfig.description,
              metadata: {
                saasCreatorId: saasCreator.id,
                platformOwner: 'true'
              }
            });
            stripeProductId = stripeProduct.id;
            console.log(`    ✅ Stripe product created: ${stripeProductId}`);
          } catch (error: any) {
            console.error(`    ⚠️  Failed to create Stripe product:`, error.message);
          }
        } else {
          console.log(`    ⚠️  Stripe not configured - skipping Stripe product creation`);
        }

        // Create product in database
        product = await prisma.product.create({
          data: {
            saasCreatorId: saasCreator.id,
            name: productConfig.name,
            description: productConfig.description,
            stripeProductId: stripeProductId,
            isActive: true
          }
        });
        console.log(`    ✅ Database product created`);
      } else {
        console.log(`    ℹ️  Product already exists in database`);
        
        // Update Stripe product ID if missing and Stripe is configured
        if (!product.stripeProductId && stripe) {
          try {
            console.log(`    Creating missing Stripe product...`);
            const stripeProduct = await stripe.products.create({
              name: productConfig.name,
              description: productConfig.description,
              metadata: {
                saasCreatorId: saasCreator.id,
                productId: product.id,
                platformOwner: 'true'
              }
            });
            
            product = await prisma.product.update({
              where: { id: product.id },
              data: { stripeProductId: stripeProduct.id }
            });
            console.log(`    ✅ Stripe product created and linked: ${stripeProduct.id}`);
          } catch (error: any) {
            console.error(`    ⚠️  Failed to create Stripe product:`, error.message);
          }
        }
      }

      // Create tiers for the product
      for (const tierConfig of productConfig.tiers) {
        console.log(`\n    Setting up tier: ${tierConfig.name}`);
        
        // Check if tier already exists
        let tier = await prisma.tier.findFirst({
          where: {
            productId: product.id,
            name: tierConfig.name
          }
        });

        if (!tier) {
          // Create Stripe price if Stripe is configured and product has Stripe ID
          let stripePriceId: string | undefined;
          if (stripe && product.stripeProductId) {
            try {
              console.log(`      Creating Stripe price...`);
              const stripePrice = await stripe.prices.create({
                product: product.stripeProductId,
                unit_amount: tierConfig.priceAmount,
                currency: 'usd',
                recurring: {
                  interval: tierConfig.billingPeriod === 'yearly' ? 'year' : 'month'
                },
                metadata: {
                  tierName: tierConfig.name,
                  productId: product.id,
                  saasCreatorId: saasCreator.id,
                  platformOwner: 'true'
                }
              });
              stripePriceId = stripePrice.id;
              console.log(`      ✅ Stripe price created: ${stripePriceId}`);
            } catch (error: any) {
              console.error(`      ⚠️  Failed to create Stripe price:`, error.message);
            }
          } else if (!stripe) {
            console.log(`      ⚠️  Stripe not configured - skipping Stripe price creation`);
          } else if (!product.stripeProductId) {
            console.log(`      ⚠️  No Stripe product ID - skipping Stripe price creation`);
          }

          // Create tier in database
          tier = await prisma.tier.create({
            data: {
              productId: product.id,
              name: tierConfig.name,
              description: tierConfig.description,
              priceAmount: tierConfig.priceAmount,
              billingPeriod: tierConfig.billingPeriod,
              features: tierConfig.features,
              usageLimit: tierConfig.usageLimit,
              stripePriceId: stripePriceId,
              isActive: true,
              sortOrder: tierConfig.sortOrder
            }
          });
          console.log(`      ✅ Tier created in database`);
        } else {
          console.log(`      ℹ️  Tier already exists in database`);
          
          // Update Stripe price ID if missing and Stripe is configured
          if (!tier.stripePriceId && stripe && product.stripeProductId) {
            try {
              console.log(`      Creating missing Stripe price...`);
              const stripePrice = await stripe.prices.create({
                product: product.stripeProductId,
                unit_amount: tierConfig.priceAmount,
                currency: 'usd',
                recurring: {
                  interval: tierConfig.billingPeriod === 'yearly' ? 'year' : 'month'
                },
                metadata: {
                  tierName: tierConfig.name,
                  tierId: tier.id,
                  productId: product.id,
                  saasCreatorId: saasCreator.id,
                  platformOwner: 'true'
                }
              });
              
              await prisma.tier.update({
                where: { id: tier.id },
                data: { stripePriceId: stripePrice.id }
              });
              console.log(`      ✅ Stripe price created and linked: ${stripePrice.id}`);
            } catch (error: any) {
              console.error(`      ⚠️  Failed to create Stripe price:`, error.message);
            }
          }
        }
      }
    }

    // Step 4: Summary
    console.log('\n\n📊 Setup Summary:');
    console.log('================');
    
    const products = await prisma.product.findMany({
      where: { saasCreatorId: saasCreator.id },
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    console.log(`\n✅ Platform Owner: ${platformOwner.email}`);
    console.log(`✅ SaaS Creator: ${saasCreator.businessName}`);
    console.log(`✅ Products created: ${products.length}`);
    
    let tiersWithStripe = 0;
    let tiersWithoutStripe = 0;
    
    products.forEach(product => {
      console.log(`\n  📦 ${product.name}`);
      console.log(`     Stripe Product: ${product.stripeProductId || 'Not created'}`);
      product.tiers.forEach(tier => {
        const price = tier.priceAmount / 100;
        const stripeStatus = tier.stripePriceId ? '✅' : '⚠️';
        console.log(`     ${stripeStatus} ${tier.name}: $${price}/${tier.billingPeriod}`);
        console.log(`        Stripe Price: ${tier.stripePriceId || 'Not created'}`);
        if (tier.stripePriceId) tiersWithStripe++;
        else tiersWithoutStripe++;
      });
    });

    console.log('\n================');
    console.log(`Tiers with Stripe prices: ${tiersWithStripe}`);
    console.log(`Tiers without Stripe prices: ${tiersWithoutStripe}`);
    
    if (tiersWithoutStripe > 0 && !stripe) {
      console.log('\n⚠️  WARNING: Stripe is not configured!');
      console.log('   Tiers without Stripe price IDs will not be visible on the pricing page.');
      console.log('   Set STRIPE_SECRET_KEY in your .env file and run this script again.');
    }

    console.log('\n✅ Full platform owner setup complete!');
    console.log('\nCreators can now onboard and view available products on the pricing page.');

  } catch (error) {
    console.error('\n❌ Error during platform setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupFullPlatformOwner();
