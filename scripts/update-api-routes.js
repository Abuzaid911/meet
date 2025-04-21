#!/usr/bin/env node

/**
 * This script updates API routes from NextAuth to Better Auth
 * Run this script after installing Better Auth
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const API_DIR = path.resolve(process.cwd(), 'app/api');

// Find all TypeScript and TSX files recursively in the API directory
console.log('Finding all API route files...');
const tsFilesOutput = execSync(`find ${API_DIR} -type f -name "*.ts*"`).toString();
const tsFiles = tsFilesOutput.split('\n').filter(Boolean);

console.log(`Found ${tsFiles.length} API route files.`);

// Process each file
let updatedFiles = 0;

tsFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't use next-auth or getServerSession
    if (!content.includes('next-auth') && !content.includes('getServerSession')) {
      return;
    }
    
    console.log(`Processing ${filePath}...`);
    
    // Replace imports
    let updatedContent = content
      // Replace the import for getServerSession
      .replace(/import\s+{\s*getServerSession\s*}\s+from\s+['"]next-auth.*?['"]/g, 
               `import { getServerSession } from "better-auth/next-js"`)
      // Replace next-auth import for Session type
      .replace(/import\s+.*?{\s*.*?Session.*?\s*}.*?\s+from\s+['"]next-auth['"]/g, 
               `import { Session } from "better-auth"`)
      // Replace authOptions import (since we renamed authOptions to auth)
      .replace(/import\s+{\s*authOptions\s*}\s+from\s+["']@\/lib\/auth["']/g, 
               `import { auth } from "@/lib/auth"`)
      // Replace getServerSession(authOptions) calls
      .replace(/getServerSession\s*\(\s*authOptions\s*\)/g, 
               `getServerSession(auth)`)
      // Replace references to authOptions with auth
      .replace(/authOptions/g, 'auth');
    
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

console.log(`\n✅ Updated ${updatedFiles} API route files successfully.`);
console.log('\n⚠️ Note: You may need to manually fix remaining type issues or specific implementation details.'); 