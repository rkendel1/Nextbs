const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyBrandMigration() {
  const prisma = new PrismaClient();
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_brand_data_fields.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying brand data fields migration...');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.toLowerCase().includes('alter table') || 
          statement.toLowerCase().includes('create index') ||
          statement.toLowerCase().includes('update')) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`Executed: ${statement.substring(0, 50)}...`);
        } catch (error) {
          // If column already exists, that's okay
          if (error.code === '42P07' || error.message.includes('already exists')) {
            console.log(`Column/index already exists, skipping: ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('Brand data fields migration applied successfully!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyBrandMigration();