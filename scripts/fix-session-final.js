#!/usr/bin/env node

/**
 * This script fixes the auth.getSession method calls in API routes
 * The correct method based on Better Auth docs is auth.api.getSession()
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('auth.getSession')) {
        console.log(`Processing ${filePath}...`);
        
        // Update auth.getSession to use the correct method in Better Auth
        const updatedContent = content
          .replace(/auth\.getSession\(\)/g, 'auth.api.getSession(request)');
        
        if (content !== updatedContent) {
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          updatedFiles++;
          console.log(`✅ Updated ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Fixed server session calls in ${updatedFiles} files.`); 