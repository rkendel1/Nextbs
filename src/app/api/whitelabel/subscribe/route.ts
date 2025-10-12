import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/utils/prismaDB';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, tierId, domain } = body;

    if (!productId || !tierId || !domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch whiteLabelConfig by domain, include saasCreator and related
    const whiteLabelConfig = await prisma.whiteLabelConfig.findFirst({
      where: {
        OR: [
          { customDomain: domain },
          { subdomain: domain }
        ]
      },
      include: {
        saasCreator: {
          include: {
            products: {
              where: { id: productId },
              include: {
                tiers: {
                  where: { id: tierId },
                },
              },
            },
            stripeAccount: true,
          },
        },
      },
    });

    if (!whiteLabelConfig || !whiteLabelConfig.saasCreator || !whiteLabelConfig.saasCreator.products[0] || !whiteLabelConfig.saasCreator.products[0].tiers[0]) {
      return NextResponse.json({ error: 'Product or tier not found for this domain' }, { status: 404 });
    }

    const creator = whiteLabelConfig.saasCreator;
    const product = creator.products[0];
    const tier = product.tiers[0];
    const creatorStripeAccountId = creator.stripeAccount?.stripeAccountId;

    if (!creatorStripeAccountId) {
      return NextResponse.json({ error: 'Creator not set up for payments' }, { status: 400 });
    }

    const siteUrl = process.env.SITE_URL || request.headers.get('origin') || 'http://localhost:3000';

    let successPath = whiteLabelConfig.successRedirect || '/payment-success';
    // Normalize successPath to remove leading domain if present
    if (successPath.startsWith(`/${domain}`)) {
      successPath = successPath.slice(domain.length + 1);
    }
    const success_url = `${siteUrl}/${domain}${successPath}`;
    const cancel_url = `${siteUrl}/${domain}/products`;

    if (tier.priceAmount === 0) {
      // Free tier: Create subscription directly and notify creator
      const subscription = await prisma.subscription.create({
        data: {
          saasCreatorId: creator.id,
          productId,
          tierId,
          status: 'active',
          userId: null, // Anonymous for now
        },
      });

      await prisma.notification.create({
        data: {
          userId: creator.userId,
          type: 'new_subscriber',
          message: `New free subscriber to ${product.name} via ${domain}`,
          metadata: {
            subscriptionId: subscription.id,
            productId,
            tierId,
            domain,
          },
        },
      });

      return NextResponse.json({ url: success_url });
    }

    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${product.name} - ${tier.name}`,
          description: tier.description ?? undefined,
        },
        unit_amount: tier.priceAmount,
        recurring: {
          interval: tier.billingPeriod === 'monthly' ? ('month' as const) : tier.billingPeriod === 'yearly' ? ('year' as const) : ('month' as const),
        },
      },
      quantity: 1,
    }];

    // Create checkout session on connected account
    const sessionData = await stripe.checkout.sessions.create(
      {
        line_items: lineItems,
        mode: 'subscription',
        success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          creatorId: creator.id,
          productId: productId,
          tierId: tierId,
          domain: domain,
        },
      },
      {
        stripeAccount: creatorStripeAccountId,
      }
    );

    return NextResponse.json({ url: sessionData.url });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}