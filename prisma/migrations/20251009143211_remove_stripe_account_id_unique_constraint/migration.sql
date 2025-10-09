-- DropIndex
DROP INDEX "StripeAccount_stripeAccountId_key";

-- CreateIndex
CREATE INDEX "StripeAccount_stripeAccountId_idx" ON "StripeAccount"("stripeAccountId");
