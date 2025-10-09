const { PrismaClient } = require('@prisma/client');

async function verifyMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verifying brand data fields migration...');
    
    // Test if we can query the logoUrl field without error
    const testQuery = await prisma.saasCreator.findFirst({
      select: {
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        crawlStatus: true
      }
    });
    
    console.log('✅ Migration verified! The logoUrl field is now accessible.');
    console.log('✅ All brand data fields are working correctly.');
    
    // Show sample data if available
    if (testQuery) {
      console.log('Sample data structure:', {
        logoUrl: testQuery.logoUrl || 'null',
        faviconUrl: testQuery.faviconUrl || 'null',
        primaryColor: testQuery.primaryColor || 'null',
        secondaryColor: testQuery.secondaryColor || 'null',
        crawlStatus: testQuery.crawlStatus || 'null'
      });
    }
    
  } catch (error) {
    if (error.code === 'P2022') {
      console.error('❌ Migration failed! Column still does not exist:', error.meta.column);
      console.error('The migration may need to be applied manually.');
    } else {
      console.error('❌ Error verifying migration:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();