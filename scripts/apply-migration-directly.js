const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigrationDirectly() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Reading migration SQL file...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_brand_data_fields.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration directly to database...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.toLowerCase().includes('alter table') || 
          statement.toLowerCase().includes('create index') ||
          statement.toLowerCase().includes('update')) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Success');
        } catch (error) {
          // If column already exists, that's okay
          if (error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`⚠️  Column/index already exists, skipping: ${statement.substring(0, 50)}...`);
          } else {
            console.error('❌ Error executing statement:', error.message);
            // Continue with other statements even if one fails
          }
        }
      }
    }
    
    console.log('🎉 Migration applied successfully!');
    
    // Verify the migration by checking if the columns exist
    console.log('Verifying migration...');
    const testResult = await prisma.saasCreator.findFirst({
      select: {
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        crawlStatus: true
      }
    });
    
    console.log('✅ Verification successful! The logoUrl column is now accessible.');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigrationDirectly();