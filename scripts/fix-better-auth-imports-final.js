#!/usr/bin/env node

/**
 * This script fixes Better Auth import errors
 * Run this script to correct import statements
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.cwd();
const API_DIR = path.join(PROJECT_DIR, 'app', 'api');

// Find all API route files
console.log('Finding API route files...');
const apiFilesOutput = execSync(`find "${API_DIR}" -type f -name "*.ts"`).toString();
const apiFiles = apiFilesOutput.split('\n').filter(Boolean);

console.log(`Found ${apiFiles.length} API route files.`);

// Process each file
let updatedFiles = 0;

apiFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`Processing ${filePath}...`);
    
    // Update to use auth.getServerSession()
    let updatedContent = content
      // Remove the getSession import line
      .replace(/import\s+{\s*getSession\s*}\s+from\s+["']better-auth\/next-js["'];?\n/g, '')
      // Remove the auth import line
      .replace(/import\s+{\s*auth\s*}\s+from\s+["']@\/lib\/auth["'];?\n/g, '')
      // Add the proper import for auth
      .replace(/import\s+{/g, 'import { auth } from "@/lib/auth";\nimport {')
      // Replace getSession() calls with auth.getServerSession()
      .replace(/const\s+session\s*=\s*await\s+getSession\(\)/g, 'const session = await auth.getServerSession()');
    
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

// Find the GoogleButton component
console.log('\nUpdating GoogleButton component...');
const googleButtonPath = path.join(PROJECT_DIR, 'app', 'components', 'GoogleButton.tsx');
try {
  if (fs.existsSync(googleButtonPath)) {
    const content = fs.readFileSync(googleButtonPath, 'utf8');
    // Replace the import for signIn
    const updatedContent = content
      .replace(/import\s+{\s*signIn\s*}\s+from\s+['"]better-auth\/react['"];?\n/g, '')
      .replace(/import\s+{\s*createAuthClient\s*}\s+from\s+['"]better-auth\/react['"];?\n*const\s+{\s*signIn\s*}\s*=\s*createAuthClient\(\);?/g, 
              "import { createAuthClient } from 'better-auth/react';\n\nconst { signIn } = createAuthClient();");
    
    if (content !== updatedContent) {
      fs.writeFileSync(googleButtonPath, updatedContent, 'utf8');
      updatedFiles++;
      console.log(`✅ Updated ${googleButtonPath}`);
    }
  }
} catch (error) {
  console.error(`❌ Error updating GoogleButton:`, error.message);
}

console.log(`\n✅ Updated ${updatedFiles} files successfully.`);
console.log('\n⚠️ Note: You may need to manually fix remaining import issues.'); 