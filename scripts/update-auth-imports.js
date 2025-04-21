#!/usr/bin/env node

/**
 * This script updates NextAuth imports to Better Auth imports
 * Run this script after installing Better Auth
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
    
    // Skip files that don't use next-auth
    if (!content.includes('next-auth')) {
      return;
    }
    
    console.log(`Processing ${filePath}...`);
    
    // Replace imports
    let updatedContent = content
      // Replace import statements
      .replace(/import\s+{([^}]*)}\s+from\s+['"]next-auth\/react['"]/g, (match, importedItems) => {
        return `import { createAuthClient } from "better-auth/react"\n\nconst { ${importedItems} } = createAuthClient()`;
      })
      // Replace useSession status with isPending
      .replace(/const\s+{\s*data:\s*session,\s*status\s*}\s*=\s*useSession\(\)/g, 
               'const { data: session, isPending: status } = useSession()')
      // Replace regular signIn calls
      .replace(/signIn\(\)/g, 'signIn.social("google")')
      // Replace provider-specific signIn calls
      .replace(/signIn\(['"]([^'"]+)['"](.*)\)/g, 'signIn.social("$1"$2)');
    
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
console.log('\n⚠️ Note: You may need to manually fix some imports or typing issues.'); 