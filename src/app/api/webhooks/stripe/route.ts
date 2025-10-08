import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to send email notification
async function sendEmailNotification(
  userId: string,
  type: string,
  subject: string,
  body: string,
  recipient: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.emailNotification.create({
      data: {
        userId,
        type,
        subject,
        body,
        recipient,
        status: 'pending',
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to create email notification:", error);
  }
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Handling subscription created:", subscription.id);
  
  try {
    // Find the subscription in our database
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true, product: true, tier: true },
    });

    if (!dbSubscription) {
      console.error("Subscription not found in database:", subscription.id);
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    // Send email notification
    await sendEmailNotification(
      dbSubscription.userId,
      'subscription_created',
      'Your Subscription is Active',
      `Your subscription to ${dbSubscription.product.name} (${dbSubscription.tier.name}) is now active.`,
      dbSubscription.user.email!,
      { subscriptionId: subscription.id }
    );
  } catch (error) {
    console.error("Error handling subscription created:", error);
    throw error;
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Handling subscription updated:", subscription.id);
  
  try {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true, product: true, tier: true },
    });

    if (!dbSubscription) {
      console.error("Subscription not found in database:", subscription.id);
      return;
    }

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Send email notification for status changes
    if (subscription.cancel_at_period_end) {
      await sendEmailNotification(
        dbSubscription.userId,
        'subscription_cancelled',
        'Your Subscription Will Be Cancelled',
        `Your subscription to ${dbSubscription.product.name} will be cancelled at the end of the current billing period.`,
        dbSubscription.user.email!,
        { subscriptionId: subscription.id }
      );
    } else {
      await sendEmailNotification(
        dbSubscription.userId,
        'subscription_updated',
        'Your Subscription Has Been Updated',
        `Your subscription to ${dbSubscription.product.name} has been updated.`,
        dbSubscription.user.email!,
        { subscriptionId: subscription.id }
      );
    }
  } catch (error) {
    console.error("Error handling subscription updated:", error);
    throw error;
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Handling subscription deleted:", subscription.id);
  
  try {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true, product: true },
    });

    if (!dbSubscription) {
      console.error("Subscription not found in database:", subscription.id);
      return;
    }

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: 'canceled',
      },
    });

    await sendEmailNotification(
      dbSubscription.userId,
      'subscription_cancelled',
      'Your Subscription Has Been Cancelled',
      `Your subscription to ${dbSubscription.product.name} has been cancelled.`,
      dbSubscription.user.email!,
      { subscriptionId: subscription.id }
    );
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
    throw error;
  }
}

// Handle payment succeeded
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Handling payment succeeded:", paymentIntent.id);
  
  try {
    const invoice = paymentIntent.invoice;
    if (!invoice) return;

    const subscription = await stripe.subscriptions.retrieve(
      typeof invoice === 'string' ? invoice : invoice.id
    );

    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true, product: true },
    });

    if (!dbSubscription) {
      return;
    }

    await sendEmailNotification(
      dbSubscription.userId,
      'payment_succeeded',
      'Payment Received',
      `We've received your payment of $${(paymentIntent.amount / 100).toFixed(2)} for ${dbSubscription.product.name}.`,
      dbSubscription.user.email!,
      { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount }
    );
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
  }
}

// Handle payment failed
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Handling payment failed:", paymentIntent.id);
  
  try {
    const invoice = paymentIntent.invoice;
    if (!invoice) return;

    const subscription = await stripe.subscriptions.retrieve(
      typeof invoice === 'string' ? invoice : invoice.id
    );

    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true, product: true },
    });

    if (!dbSubscription) {
      return;
    }

    await sendEmailNotification(
      dbSubscription.userId,
      'payment_failed',
      'Payment Failed',
      `Your payment of $${(paymentIntent.amount / 100).toFixed(2)} for ${dbSubscription.product.name} has failed. Please update your payment method.`,
      dbSubscription.user.email!,
      { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount }
    );
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Log the webhook event
  try {
    await prisma.webhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: event.data.object as any,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error("Failed to log webhook event:", error);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark as processed
    await prisma.webhookEvent.updateMany({
      where: { eventId: event.id },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    
    // Mark as failed
    await prisma.webhookEvent.updateMany({
      where: { eventId: event.id },
      data: {
        status: 'failed',
        error: error.message,
        retryCount: { increment: 1 },
      },
    });

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
