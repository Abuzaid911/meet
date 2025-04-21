#!/usr/bin/env node

/**
 * This script removes unused auth imports
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.cwd();
const filesToFix = [
  path.join(PROJECT_DIR, 'app', 'api', 'events', 'public', 'route.ts'),
  path.join(PROJECT_DIR, 'app', 'api', 'test-db', 'route.ts'),
  path.join(PROJECT_DIR, 'app', 'api', 'test-event-photos', 'route.ts'),
  path.join(PROJECT_DIR, 'app', 'api', 'users', 'route.ts')
];

console.log('Fixing unused auth imports...');

// Process each file
let updatedFiles = 0;

filesToFix.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`Processing ${filePath}...`);
      
      // Remove unused auth import
      const updatedContent = content
        .replace(/import\s+{\s*auth\s*}\s+from\s+["']@\/lib\/auth["'];?\n/g, '');
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        updatedFiles++;
        console.log(`✅ Updated ${filePath}`);
      }
    } else {
      console.log(`❗ File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Fixed unused imports in ${updatedFiles} files.`); 