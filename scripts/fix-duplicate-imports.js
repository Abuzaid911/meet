#!/usr/bin/env node

/**
 * This script fixes duplicate auth imports
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
    
    // First, check if there are duplicate auth imports
    const importCount = (content.match(/import\s+{\s*auth\s*}\s+from\s+["']@\/lib\/auth["']/g) || []).length;
    
    if (importCount > 1) {
      console.log(`Processing ${filePath}... (${importCount} auth imports found)`);
      
      // Fix duplicate imports by removing all but the first one
      let lines = content.split('\n');
      let foundFirst = false;
      let updatedLines = [];
      
      for (const line of lines) {
        if (line.match(/import\s+{\s*auth\s*}\s+from\s+["']@\/lib\/auth["']/)) {
          if (!foundFirst) {
            updatedLines.push(line);
            foundFirst = true;
          }
          // Skip duplicates
        } else {
          updatedLines.push(line);
        }
      }
      
      const updatedContent = updatedLines.join('\n');
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        updatedFiles++;
        console.log(`✅ Updated ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Fixed duplicate imports in ${updatedFiles} files.`); 