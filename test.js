// Run this file to debug your setup
// Usage: node debug-setup.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Ghost Followers App - Setup Debugger\n');
console.log('=' .repeat(50));

// Check 1: Project structure
console.log('\n✅ Checking project structure...');
const hasAppFolder = fs.existsSync('app');
const hasPagesFolder = fs.existsSync('pages');

if (hasAppFolder) {
  console.log('   ✓ Using App Router (Next.js 13+)');
} else if (hasPagesFolder) {
  console.log('   ✓ Using Pages Router');
} else {
  console.log('   ❌ No app/ or pages/ folder found!');
}

// Check 2: API routes
console.log('\n✅ Checking API routes...');
const apiPaths = [
  'app/api/twitter/user/route.ts',
  'app/api/twitter/followers/route.ts',
  'pages/api/twitter/user.ts',
  'pages/api/twitter/followers.ts'
];

let foundRoutes = 0;
apiPaths.forEach(p => {
  if (fs.existsSync(p)) {
    console.log(`   ✓ Found: ${p}`);
    foundRoutes++;
  }
});

if (foundRoutes === 0) {
  console.log('   ❌ No API routes found!');
  console.log('   → You need to create API route files');
}

// Check 3: Environment variables
console.log('\n✅ Checking environment variables...');
const envFiles = ['.env.local', '.env'];
let foundEnv = false;

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ Found: ${file}`);
    const content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('TWITTER_API_KEY')) {
      const hasRealKey = !content.includes('your_api_key_here') && 
                         !content.includes('your_twitter_api_key_here');
      if (hasRealKey) {
        console.log('   ✓ TWITTER_API_KEY is set');
      } else {
        console.log('   ⚠️  TWITTER_API_KEY looks like a placeholder');
      }
      foundEnv = true;
    } else {
      console.log('   ❌ TWITTER_API_KEY not found in file');
    }
  }
});

if (!foundEnv) {
  console.log('   ❌ No .env.local file found with TWITTER_API_KEY');
}

// Check 4: Dependencies
console.log('\n✅ Checking dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  if (deps.next) {
    console.log(`   ✓ Next.js: ${deps.next}`);
  } else {
    console.log('   ❌ Next.js not found in dependencies');
  }
  
  if (deps.react) {
    console.log(`   ✓ React: ${deps.react}`);
  }
} catch (err) {
  console.log('   ❌ Could not read package.json');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Summary:');

if (hasAppFolder && foundRoutes >= 2 && foundEnv) {
  console.log('   ✅ Setup looks good!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Make sure dev server is running: npm run dev');
  console.log('   2. Test API: http://localhost:3000/api/twitter/user?username=elonmusk');
} else {
  console.log('   ⚠️  Issues detected. Please fix the items marked with ❌\n');
  
  if (!hasAppFolder && !hasPagesFolder) {
    console.log('   📝 Action: Verify you\'re in the correct project directory');
  }
  
  if (foundRoutes === 0) {
    console.log('   📝 Action: Create API route files in app/api/twitter/');
    console.log('      - app/api/twitter/user/route.ts');
    console.log('      - app/api/twitter/followers/route.ts');
  }
  
  if (!foundEnv) {
    console.log('   📝 Action: Create .env.local file with TWITTER_API_KEY');
  }
}

console.log('\n' + '='.repeat(50));