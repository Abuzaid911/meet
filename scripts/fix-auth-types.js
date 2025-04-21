#!/usr/bin/env node

/**
 * This script finds and fixes common type issues when migrating from NextAuth to Better Auth
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const APP_DIR = path.resolve(process.cwd(), 'app');

// Find all TypeScript and TSX files recursively
console.log('Finding all TypeScript files...');
const tsFilesOutput = execSync(`find ${APP_DIR} -type f -name "*.ts*"`).toString();
const tsFiles = tsFilesOutput.split('\n').filter(Boolean);

console.log(`Found ${tsFiles.length} TypeScript files.`);

// Process each file
let updatedFiles = 0;

tsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't use better-auth
    if (!content.includes('better-auth')) {
      return;
    }
    
    console.log(`Processing ${filePath}...`);
    
    // Replace status with isPending
    let updatedContent = content
      // Fix useSession destructuring 
      .replace(/const\s+{\s*data:\s*session,\s*status\s*}/g, 'const { data: session, isPending: status }')
      .replace(/const\s+{\s*status\s*}/g, 'const { isPending: status }')
      // Fix reference to status === 'loading'
      .replace(/status\s*===\s*['"]loading['"]/g, 'status === true')
      .replace(/status\s*===\s*['"]authenticated['"]/g, '!status && session')
      .replace(/status\s*===\s*['"]unauthenticated['"]/g, '!status && !session');
    
    // Write the updated content back to the file if changes were made
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      updatedFiles++;
      console.log(`✅ Updated ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Updated ${updatedFiles} files successfully.`);
console.log('\n⚠️ Note: You may need to manually fix remaining type issues.'); 