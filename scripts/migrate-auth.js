#!/usr/bin/env node

/**
 * This script runs the Better Auth migrations
 * It should be run after installing Better Auth
 */

import { execSync } from 'child_process';

console.log('Running Better Auth migrations...');

try {
  execSync('npx @better-auth/cli migrate', { stdio: 'inherit' });
  console.log('✅ Better Auth migrations completed successfully');
} catch (error) {
  console.error('❌ Error running Better Auth migrations:', error.message);
  process.exit(1);
} 