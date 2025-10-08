import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrCreatePlatformOwner() {
  try {
    // Check if there's already a platform owner
    const platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' }
    });

    if (platformOwner) {
      console.log('Platform owner already exists:', platformOwner.email);
      return;
    }

    // Check if there are any users at all
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('No users found in database');
      return;
    }

    // Get the first user and make them platform owner
    const firstUser = await prisma.user.findFirst({
      orderBy: { id: 'asc' }
    });

    if (firstUser) {
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { role: 'platform_owner' }
      });
      console.log('Made first user platform owner:', firstUser.email);
    } else {
      console.log('No users found to make platform owner');
    }
  } catch (error) {
    console.error('Error checking/creating platform owner:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrCreatePlatformOwner();