import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verification script to check platform owner setup for creator onboarding
 * This script validates that:
 * 1. Platform owner exists
 * 2. SaasCreator profile is complete
 * 3. Active products exist
 * 4. Tiers have Stripe price IDs
 */
async function verifyPlatformSetup() {
  try {
    console.log('🔍 Verifying Platform Owner Setup...\n');
    
    let allChecks = true;

    // Check 1: Platform Owner User
    console.log('1️⃣  Checking Platform Owner User...');
    const platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' }
    });

    if (!platformOwner) {
      console.log('   ❌ FAILED: No platform owner user found');
      console.log('   Action: Run npm run setup:platform');
      allChecks = false;
    } else {
      console.log(`   ✅ PASSED: Platform owner found (${platformOwner.email})`);
    }

    if (!platformOwner) {
      console.log('\n❌ Cannot continue without platform owner. Run setup script first.\n');
      return;
    }

    // Check 2: SaasCreator Profile
    console.log('\n2️⃣  Checking SaasCreator Profile...');
    const saasCreator = await prisma.saasCreator.findUnique({
      where: { userId: platformOwner.id }
    });

    if (!saasCreator) {
      console.log('   ❌ FAILED: No SaasCreator profile found');
      console.log('   Action: Run npm run setup:platform');
      allChecks = false;
    } else {
      console.log(`   ✅ PASSED: SaasCreator found (${saasCreator.businessName})`);
      
      if (!saasCreator.onboardingCompleted) {
        console.log('   ⚠️  WARNING: Onboarding not completed');
        allChecks = false;
      } else {
        console.log(`   ✅ Onboarding completed (step ${saasCreator.onboardingStep})`);
      }
    }

    if (!saasCreator) {
      console.log('\n❌ Cannot continue without SaasCreator profile. Run setup script first.\n');
      return;
    }

    // Check 3: Active Products
    console.log('\n3️⃣  Checking Active Products...');
    const activeProducts = await prisma.product.findMany({
      where: {
        saasCreatorId: saasCreator.id,
        isActive: true
      },
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (activeProducts.length === 0) {
      console.log('   ❌ FAILED: No active products found');
      console.log('   Action: Run npm run setup:platform');
      allChecks = false;
    } else {
      console.log(`   ✅ PASSED: ${activeProducts.length} active product(s) found`);
    }

    // Check 4: Products with Stripe Integration
    console.log('\n4️⃣  Checking Stripe Integration...');
    let productsWithStripe = 0;
    let tiersWithStripe = 0;
    let tiersWithoutStripe = 0;

    for (const product of activeProducts) {
      const hasStripeProduct = !!product.stripeProductId;
      if (hasStripeProduct) productsWithStripe++;
      
      console.log(`\n   📦 ${product.name}`);
      console.log(`      Stripe Product: ${product.stripeProductId || '❌ Missing'}`);
      
      if (product.tiers.length === 0) {
        console.log('      ❌ No tiers found for this product');
        allChecks = false;
      } else {
        for (const tier of product.tiers) {
          const hasStripePrice = !!tier.stripePriceId;
          if (hasStripePrice) tiersWithStripe++;
          else tiersWithoutStripe++;

          const priceFormatted = (tier.priceAmount / 100).toFixed(2);
          const status = hasStripePrice ? '✅' : '❌';
          console.log(`      ${status} ${tier.name}: $${priceFormatted}/${tier.billingPeriod}`);
          
          if (!hasStripePrice) {
            console.log(`         Missing Stripe Price ID`);
          } else {
            console.log(`         Stripe Price: ${tier.stripePriceId}`);
          }
        }
      }
    }

    // Check 5: API Endpoint Compatibility
    console.log('\n5️⃣  Checking API Endpoint Compatibility...');
    console.log(`   Tiers with Stripe prices: ${tiersWithStripe}`);
    console.log(`   Tiers without Stripe prices: ${tiersWithoutStripe}`);
    
    if (tiersWithStripe === 0) {
      console.log('   ❌ FAILED: No tiers with Stripe price IDs');
      console.log('   Impact: Pricing page will be empty');
      console.log('   Action: Ensure STRIPE_SECRET_KEY is set and run setup:platform again');
      allChecks = false;
    } else if (tiersWithoutStripe > 0) {
      console.log('   ⚠️  WARNING: Some tiers missing Stripe price IDs');
      console.log('   Impact: Only tiers with Stripe prices will show on pricing page');
      console.log('   Action: Run setup:platform again with STRIPE_SECRET_KEY set');
    } else {
      console.log('   ✅ PASSED: All tiers have Stripe price IDs');
    }

    // Check 6: What the API would return
    console.log('\n6️⃣  Simulating API Response...');
    const apiTiers = activeProducts.flatMap(product => 
      product.tiers
        .filter(tier => tier.stripePriceId) // API filters these
        .map(tier => ({
          id: tier.id,
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

    console.log(`   API would return ${apiTiers.length} tier(s):`);
    apiTiers.forEach(tier => {
      const price = (tier.unit_amount / 100).toFixed(2);
      console.log(`   - ${tier.product.name} - ${tier.nickname}: $${price}`);
    });

    if (apiTiers.length === 0) {
      console.log('   ❌ FAILED: API would return empty array');
      console.log('   Impact: Pricing page will show "No plans available"');
      allChecks = false;
    }

    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    if (allChecks && tiersWithStripe > 0) {
      console.log('✅ All checks passed!');
      console.log('✅ Platform is ready for creator onboarding');
      console.log('\nNext steps:');
      console.log('1. Visit /pricing to see the products');
      console.log('2. Test creator signup and product selection');
      console.log('3. Verify Stripe checkout flow');
    } else {
      console.log('❌ Some checks failed or warnings found');
      console.log('\nRecommended actions:');
      
      if (!platformOwner || !saasCreator) {
        console.log('1. Run: npm run setup:platform');
      } else if (tiersWithoutStripe > 0) {
        console.log('1. Set STRIPE_SECRET_KEY in .env file');
        console.log('2. Run: npm run setup:platform');
        console.log('3. Run: npm run verify:setup');
      }
    }

    console.log('\n' + '='.repeat(50));

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyPlatformSetup();
