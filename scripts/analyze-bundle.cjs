#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Bundle Size Analysis\n');

// Check if build directory exists
const buildDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze build info
const buildManifest = path.join(buildDir, 'build-manifest.json');
const appBuildManifest = path.join(buildDir, 'app-build-manifest.json');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dir, name) {
  if (!fs.existsSync(dir)) return;
  
  console.log(`\n📂 ${name}:`);
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const fileStats = [];
  
  for (const file of files) {
    if (file.isFile()) {
      const filePath = path.join(dir, file.name);
      const stats = fs.statSync(filePath);
      fileStats.push({
        name: file.name,
        size: stats.size,
        path: filePath
      });
    }
  }
  
  // Sort by size (largest first)
  fileStats.sort((a, b) => b.size - a.size);
  
  let totalSize = 0;
  fileStats.forEach(file => {
    totalSize += file.size;
    console.log(`  ${file.name.padEnd(40)} ${formatBytes(file.size)}`);
  });
  
  console.log(`  ${'TOTAL'.padEnd(40)} ${formatBytes(totalSize)}`);
  
  return totalSize;
}

// Analyze static files
const staticDir = path.join(buildDir, 'static');
let staticSize = 0;
if (fs.existsSync(staticDir)) {
  console.log('\n🎯 Static Assets Analysis:');
  
  const subdirs = ['chunks', 'css', 'js', 'media'];
  subdirs.forEach(subdir => {
    const subdirPath = path.join(staticDir, subdir);
    const size = analyzeDirectory(subdirPath, `Static/${subdir}`);
    staticSize += size || 0;
  });
}

// Analyze app directory
const appDir = path.join(buildDir, 'app');
const appSize = analyzeDirectory(appDir, 'App Directory');

// Summary
console.log('\n📊 Bundle Size Summary:');
console.log('─'.repeat(50));
console.log(`Static Assets: ${formatBytes(staticSize)}`);
console.log(`App Bundle: ${formatBytes(appSize || 0)}`);
console.log(`Total: ${formatBytes(staticSize + (appSize || 0))}`);

// Performance recommendations
console.log('\n💡 Performance Recommendations:');

if (staticSize > 1024 * 1024) { // > 1MB
  console.log('⚠️  Large static bundle detected. Consider:');
  console.log('   - Code splitting with dynamic imports');
  console.log('   - Tree shaking unused code');
  console.log('   - Image optimization');
}

if (staticSize < 500 * 1024) { // < 500KB
  console.log('✅ Good bundle size!');
}

// Check for specific performance issues
const chunksDir = path.join(staticDir, 'chunks');
if (fs.existsSync(chunksDir)) {
  const chunks = fs.readdirSync(chunksDir);
  const largeChunks = chunks.filter(chunk => {
    const stats = fs.statSync(path.join(chunksDir, chunk));
    return stats.size > 200 * 1024; // > 200KB
  });
  
  if (largeChunks.length > 0) {
    console.log('\n⚠️  Large chunks detected:');
    largeChunks.forEach(chunk => {
      const stats = fs.statSync(path.join(chunksDir, chunk));
      console.log(`   ${chunk}: ${formatBytes(stats.size)}`);
    });
    console.log('   Consider splitting these chunks further.');
  }
}

console.log('\n🚀 Next Steps:');
console.log('   1. Run "npm run performance:analyze" for detailed analysis');
console.log('   2. Use "npm run build && npm run start" to test production build');
console.log('   3. Check Lighthouse score with "npm run performance:audit"');

console.log('\n📈 Performance Targets:');
console.log('   • First Contentful Paint: < 1.5s');
console.log('   • Largest Contentful Paint: < 2.5s');
console.log('   • Total Bundle Size: < 1MB gzipped');
console.log('   • Lighthouse Score: > 90'); 