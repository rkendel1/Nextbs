import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/SaasOnboarding";

export default async function OnboardingPage() {
  const session = await getServerSession();

  if (!session) {
    redirect(`/?auth=signin&callbackUrl=%2Fsaas%2Fonboarding`);
  }

  return <OnboardingWizard />;
}