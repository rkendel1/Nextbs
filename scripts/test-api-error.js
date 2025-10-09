const { PrismaClient } = require('@prisma/client');

async function testApiError() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing the specific query that was failing...');
    
    // This is the exact query that was failing in the API route
    const user = await prisma.user.findFirst({
      include: { 
        saasCreator: {
          select: {
            logoUrl: true,
            faviconUrl: true,
            primaryColor: true,
            secondaryColor: true,
            crawlStatus: true,
            crawlJobId: true,
            crawlCompletedAt: true
          }
        } 
      }
    });
    
    console.log('✅ SUCCESS! The query now works without errors.');
    console.log('✅ The logoUrl field is accessible in the database.');
    
    if (user && user.saasCreator) {
      console.log('Sample SaasCreator data:', {
        logoUrl: user.saasCreator.logoUrl || 'null',
        faviconUrl: user.saasCreator.faviconUrl || 'null',
        primaryColor: user.saasCreator.primaryColor || 'null',
        secondaryColor: user.saasCreator.secondaryColor || 'null',
        crawlStatus: user.saasCreator.crawlStatus || 'null'
      });
    }
    
    console.log('\n🎉 The database migration has been successfully applied!');
    console.log('The original error should now be resolved.');
    
  } catch (error) {
    if (error.code === 'P2022') {
      console.error('❌ MIGRATION FAILED! The column still does not exist:', error.meta.column);
      console.error('The migration needs to be applied manually.');
      console.error('\nTo fix this, you need to run the SQL migration:');
      console.error('File: prisma/migrations/add_brand_data_fields.sql');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testApiError();