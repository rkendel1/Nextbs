-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'PAID', 'TRIAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'FREE';
