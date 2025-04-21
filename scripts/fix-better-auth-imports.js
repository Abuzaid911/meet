#!/usr/bin/env node

/**
 * This script fixes Better Auth import errors
 * Run this script to correct import statements
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.cwd();

// Find all TypeScript and TSX files recursively
console.log('Finding files with Better Auth imports...');
const tsFilesOutput = execSync(`grep -r "better-auth" "${PROJECT_DIR}" --include="*.ts*" | cut -d: -f1 | sort | uniq`).toString();
const tsFiles = tsFilesOutput.split('\n').filter(Boolean);

console.log(`Found ${tsFiles.length} files with Better Auth imports.`);

// Process each file
let updatedFiles = 0;

tsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if not a TypeScript file
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return;
    }
    
    console.log(`Processing ${filePath}...`);
    
    // Replace imports
    let updatedContent = content
      // Fix getServerSession import in API routes
      .replace(/import\s+{\s*getServerSession\s*}\s+from\s+["']better-auth\/next-js["']/g, 
               `import { getSession } from "better-auth/next-js"`)
      // Replace getServerSession calls
      .replace(/getServerSession\s*\(\s*auth\s*\)/g, 
               `getSession()`)
      // Fix direct signIn import with createAuthClient
      .replace(/import\s+{\s*signIn\s*}\s+from\s+["']better-auth\/react["']/g, 
               `import { createAuthClient } from "better-auth/react"\n\nconst { signIn } = createAuthClient()`);
    
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
console.log('\n⚠️ Note: You may need to manually fix remaining import issues.'); 