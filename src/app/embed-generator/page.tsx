import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Embed Widget Generator',
  description: 'Generate embeddable widgets for your website',
};

export default async function EmbedGeneratorPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const saasCreator = await prisma.saasCreator.findUnique({
    where: { userId: session.user.id },
  });

  if (!saasCreator) {
    redirect('/saas/onboarding');
  }

  redirect('/saas/dashboard?tab=embeds');
}