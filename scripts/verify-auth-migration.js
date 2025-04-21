#!/usr/bin/env node

/**
 * This script verifies that all necessary changes for Better Auth migration have been applied
 * Run this after applying all other migration scripts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_DIR = process.cwd();
const AUTH_FILE = path.join(PROJECT_DIR, 'lib', 'auth.ts');
const ENV_FILE = path.join(PROJECT_DIR, '.env.local');

// Check files that need to be migrated
console.log('Verifying Better Auth migration...');

// Function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Function to check file contents
function fileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchString);
  } catch (error) {
    return false;
  }
}

// Check auth configuration file
console.log('\n1. Checking auth configuration...');
if (!fileExists(AUTH_FILE)) {
  console.error('❌ Auth file not found at:', AUTH_FILE);
} else {
  const authFileContent = fs.readFileSync(AUTH_FILE, 'utf8');
  if (authFileContent.includes('betterAuth(')) {
    console.log('✅ Auth configuration using Better Auth');
  } else if (authFileContent.includes('NextAuth')) {
    console.error('❌ Auth configuration still using NextAuth');
  } else {
    console.warn('⚠️ Auth configuration might not be correctly set up');
  }
}

// Check env variables
console.log('\n2. Checking environment variables...');
if (!fileExists(ENV_FILE)) {
  console.warn('⚠️ .env.local file not found');
} else {
  const envContent = fs.readFileSync(ENV_FILE, 'utf8');
  if (envContent.includes('BETTER_AUTH_SECRET')) {
    console.log('✅ Better Auth environment variables found');
  } else {
    console.warn('⚠️ Better Auth environment variables might be missing');
  }
}

// Check API routes
console.log('\n3. Checking API routes...');
try {
  const apiDir = path.join(PROJECT_DIR, 'app', 'api');
  const nextAuthCount = parseInt(execSync(`grep -r "next-auth" "${apiDir}" | wc -l`).toString().trim());
  const betterAuthCount = parseInt(execSync(`grep -r "better-auth" "${apiDir}" | wc -l`).toString().trim());
  
  if (nextAuthCount === 0 && betterAuthCount > 0) {
    console.log(`✅ API routes using Better Auth (${betterAuthCount} references)`);
  } else if (nextAuthCount > 0) {
    console.error(`❌ API routes still using NextAuth (${nextAuthCount} references)`);
  } else {
    console.warn('⚠️ No auth references found in API routes');
  }
} catch (error) {
  console.error('❌ Error checking API routes:', error.message);
}

// Check client components
console.log('\n4. Checking client components...');
try {
  const clientDir = path.join(PROJECT_DIR, 'app', 'components');
  const clientNextAuthCount = parseInt(execSync(`grep -r "next-auth" "${clientDir}" | wc -l`).toString().trim());
  const clientBetterAuthCount = parseInt(execSync(`grep -r "better-auth" "${clientDir}" | wc -l`).toString().trim());
  
  if (clientNextAuthCount === 0 && clientBetterAuthCount > 0) {
    console.log(`✅ Client components using Better Auth (${clientBetterAuthCount} references)`);
  } else if (clientNextAuthCount > 0) {
    console.error(`❌ Client components still using NextAuth (${clientNextAuthCount} references)`);
  } else {
    console.warn('⚠️ No auth references found in client components');
  }
} catch (error) {
  console.error('❌ Error checking client components:', error.message);
}

// Check route handlers
console.log('\n5. Checking Better Auth handler route...');
const authHandlerPath = path.join(PROJECT_DIR, 'app', 'api', 'auth', '[...betterauth]', 'route.ts');
if (fileExists(authHandlerPath)) {
  console.log('✅ Better Auth route handler found');
} else {
  console.error('❌ Better Auth route handler not found');
}

// Verify package.json dependencies
console.log('\n6. Checking package.json dependencies...');
try {
  const packageJsonPath = path.join(PROJECT_DIR, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const hasBetterAuth = packageData.dependencies && packageData.dependencies['better-auth'];
  const hasNextAuth = packageData.dependencies && packageData.dependencies['next-auth'];
  
  if (hasBetterAuth && !hasNextAuth) {
    console.log('✅ Package dependencies correct: Better Auth installed, NextAuth removed');
  } else if (hasBetterAuth && hasNextAuth) {
    console.warn('⚠️ Better Auth installed but NextAuth still in dependencies');
  } else if (!hasBetterAuth && hasNextAuth) {
    console.error('❌ NextAuth still in dependencies, Better Auth not installed');
  } else {
    console.error('❌ No auth library found in dependencies');
  }
} catch (error) {
  console.error('❌ Error checking package.json:', error.message);
}

console.log('\nMigration verification complete. Address any warnings or errors before deploying.'); 