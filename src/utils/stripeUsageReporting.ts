import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

/**
 * Report usage to Stripe for metered billing
 */
export async function reportUsageToStripe(
  subscriptionId: string,
  quantity: number,
  timestamp?: Date
): Promise<boolean> {
  try {
    // Get subscription with Stripe items
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        stripeItems: true,
        tier: true,
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      console.log("No Stripe subscription found for:", subscriptionId);
      return false;
    }

    // Check if tier has metering enabled
    if (!subscription.tier.meteringEnabled) {
      console.log("Metering not enabled for tier:", subscription.tier.id);
      return false;
    }

    // Find the metered subscription item
    const meteredItem = subscription.stripeItems.find(
      (item) => item.itemType === "metered_usage"
    );

    if (!meteredItem) {
      console.log("No metered subscription item found for:", subscriptionId);
      return false;
    }

    // Report usage to Stripe
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      meteredItem.stripeSubscriptionItemId,
      {
        quantity: Math.round(quantity),
        timestamp: timestamp ? Math.floor(timestamp.getTime() / 1000) : "now",
        action: "increment", // or 'set' to replace
      }
    );

    // Update last reported usage
    await prisma.stripeSubscriptionItem.update({
      where: { id: meteredItem.id },
      data: {
        lastReportedUsage: quantity,
        lastReportedAt: new Date(),
      },
    });

    console.log("Usage reported to Stripe:", usageRecord.id);
    return true;
  } catch (error: any) {
    console.error("Stripe usage reporting error:", error);
    return false;
  }
}

/**
 * Get current usage from Stripe
 */
export async function getStripeUsageSummary(
  subscriptionId: string,
  startDate?: Date,
  endDate?: Date
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      stripeItems: true,
    },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error("Stripe subscription not found");
  }

  const meteredItem = subscription.stripeItems.find(
    (item) => item.itemType === "metered_usage"
  );

  if (!meteredItem) {
    return {
      total_usage: 0,
      period_start: startDate,
      period_end: endDate,
      records: [],
    };
  }

  try {
    const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
      meteredItem.stripeSubscriptionItemId,
      {
        limit: 100,
      }
    );

    return {
      total_usage: usageRecords.data.reduce((sum, record) => sum + record.total_usage, 0),
      period_start: startDate,
      period_end: endDate,
      records: usageRecords.data,
    };
  } catch (error) {
    console.error("Error fetching Stripe usage:", error);
    throw error;
  }
}

/**
 * Create a metered price in Stripe
 */
export async function createMeteredPrice(
  productId: string,
  unitAmount: number,
  currency: string = "usd",
  meteringType: string = "api_calls"
): Promise<Stripe.Price> {
  try {
    const price = await stripe.prices.create({
      product: productId,
      currency,
      recurring: {
        interval: "month",
        usage_type: "metered",
        aggregate_usage: "sum",
      },
      billing_scheme: "per_unit",
      unit_amount: unitAmount,
      metadata: {
        metering_type: meteringType,
      },
    });

    return price;
  } catch (error) {
    console.error("Error creating metered price:", error);
    throw error;
  }
}

/**
 * Create a subscription with both base and metered items
 */
export async function createHybridSubscription(
  customerId: string,
  basePriceId: string,
  meteredPriceId?: string
): Promise<Stripe.Subscription> {
  try {
    const items: Stripe.SubscriptionCreateParams.Item[] = [
      {
        price: basePriceId,
      },
    ];

    if (meteredPriceId) {
      items.push({
        price: meteredPriceId,
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    return subscription;
  } catch (error) {
    console.error("Error creating hybrid subscription:", error);
    throw error;
  }
}
