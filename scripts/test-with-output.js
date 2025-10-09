const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function testWithOutput() {
  const prisma = new PrismaClient();
  const outputFile = 'scripts/test-results.txt';
  
  try {
    let output = 'Testing the specific query that was failing...\n\n';
    
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
    
    output += '✅ SUCCESS! The query now works without errors.\n';
    output += '✅ The logoUrl field is accessible in the database.\n\n';
    
    if (user && user.saasCreator) {
      output += 'Sample SaasCreator data:\n';
      output += `  logoUrl: ${user.saasCreator.logoUrl || 'null'}\n`;
      output += `  faviconUrl: ${user.saasCreator.faviconUrl || 'null'}\n`;
      output += `  primaryColor: ${user.saasCreator.primaryColor || 'null'}\n`;
      output += `  secondaryColor: ${user.saasCreator.secondaryColor || 'null'}\n`;
      output += `  crawlStatus: ${user.saasCreator.crawlStatus || 'null'}\n`;
    } else {
      output += 'No SaasCreator data found in database.\n';
    }
    
    output += '\n🎉 The database migration has been successfully applied!\n';
    output += 'The original error should now be resolved.\n';
    
    fs.writeFileSync(outputFile, output);
    
  } catch (error) {
    let errorOutput = '❌ ERROR OCCURRED:\n\n';
    
    if (error.code === 'P2022') {
      errorOutput += '❌ MIGRATION FAILED! The column still does not exist: ' + error.meta.column + '\n';
      errorOutput += 'The migration needs to be applied manually.\n';
      errorOutput += '\nTo fix this, you need to run the SQL migration:\n';
      errorOutput += 'File: prisma/migrations/add_brand_data_fields.sql\n';
    } else {
      errorOutput += '❌ Error: ' + error.message + '\n';
      errorOutput += 'Stack: ' + error.stack + '\n';
    }
    
    fs.writeFileSync(outputFile, errorOutput);
  } finally {
    await prisma.$disconnect();
  }
}

testWithOutput();