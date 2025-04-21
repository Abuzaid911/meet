#!/usr/bin/env node

/**
 * This script ensures all API route handlers have the request parameter
 * for the auth.api.getSession(request) call
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_DIR = process.cwd();
const API_DIR = path.join(PROJECT_DIR, 'app', 'api');

// Find all API route files
console.log('Finding API route files...');
const apiFilesOutput = execSync(`grep -l "auth.api.getSession" $(find "${API_DIR}" -type f -name "*.ts")`).toString();
const apiFiles = apiFilesOutput.split('\n').filter(Boolean);

console.log(`Found ${apiFiles.length} API route files with session calls.`);

// Process each file
let updatedFiles = 0;

apiFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let hasChanges = false;
      
      // Find function definitions that might be missing request parameter
      const functionMatches = content.match(/export\s+async\s+function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)/g) || [];
      
      for (const fnMatch of functionMatches) {
        // Check if the function is missing request parameter
        if (!fnMatch.includes('request') && !fnMatch.includes('Request')) {
          console.log(`Found function without request parameter in ${filePath}: ${fnMatch}`);
          
          // Replace with request parameter added
          const updatedFn = fnMatch.replace(/\(([^)]*)\)/, '(request: Request$1)');
          updatedContent = updatedContent.replace(fnMatch, updatedFn);
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        // Add Request import if needed
        if (!updatedContent.includes('import') || !updatedContent.includes('Request')) {
          if (updatedContent.includes('import') && updatedContent.includes('NextResponse')) {
            // Add Request to NextResponse import
            updatedContent = updatedContent.replace(
              /import\s+{\s*NextResponse\s*}/,
              'import { NextResponse, Request }'
            );
          } else if (updatedContent.includes('import') && updatedContent.includes('next/server')) {
            // Add Request to existing next/server import
            updatedContent = updatedContent.replace(
              /import\s+{([^}]*)}\s+from\s+['"]next\/server['"]/,
              'import { $1, Request } from "next/server"'
            );
          } else {
            // Add new import at the top
            updatedContent = `import { Request } from 'next/server';\n` + updatedContent;
          }
        }
        
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        updatedFiles++;
        console.log(`✅ Updated ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${updatedFiles} files with missing request parameters.`); 