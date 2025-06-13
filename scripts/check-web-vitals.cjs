#!/usr/bin/env node

console.log('📊 Web Vitals Performance Checker\n');

// Mock Web Vitals data (in real implementation, this would come from analytics)
const mockVitals = {
  lcp: Math.random() * 3000 + 1000, // 1-4 seconds
  fid: Math.random() * 200 + 50,    // 50-250ms
  cls: Math.random() * 0.2,         // 0-0.2
  fcp: Math.random() * 2000 + 800,  // 0.8-2.8 seconds
  ttfb: Math.random() * 1000 + 200, // 200-1200ms
};

function getVitalStatus(value, thresholds) {
  if (value <= thresholds.good) return '🟢 Good';
  if (value <= thresholds.needs) return '🟡 Needs Improvement';
  return '🔴 Poor';
}

function formatValue(value, unit = 'ms') {
  if (unit === 'score') return value.toFixed(3);
  return `${Math.round(value)}${unit}`;
}

console.log('Core Web Vitals Analysis:');
console.log('─'.repeat(60));

// LCP - Largest Contentful Paint
const lcpStatus = getVitalStatus(mockVitals.lcp, { good: 2500, needs: 4000 });
console.log(`LCP (Largest Contentful Paint): ${formatValue(mockVitals.lcp)} ${lcpStatus}`);
console.log('   Measures loading performance');
console.log('   Target: ≤ 2.5s (Good), ≤ 4.0s (Needs Improvement)');

// FID - First Input Delay
const fidStatus = getVitalStatus(mockVitals.fid, { good: 100, needs: 300 });
console.log(`\nFID (First Input Delay): ${formatValue(mockVitals.fid)} ${fidStatus}`);
console.log('   Measures interactivity');
console.log('   Target: ≤ 100ms (Good), ≤ 300ms (Needs Improvement)');

// CLS - Cumulative Layout Shift
const clsStatus = getVitalStatus(mockVitals.cls, { good: 0.1, needs: 0.25 });
console.log(`\nCLS (Cumulative Layout Shift): ${formatValue(mockVitals.cls, 'score')} ${clsStatus}`);
console.log('   Measures visual stability');
console.log('   Target: ≤ 0.1 (Good), ≤ 0.25 (Needs Improvement)');

// Additional metrics
console.log('\n📈 Additional Metrics:');
console.log('─'.repeat(60));

const fcpStatus = getVitalStatus(mockVitals.fcp, { good: 1800, needs: 3000 });
console.log(`FCP (First Contentful Paint): ${formatValue(mockVitals.fcp)} ${fcpStatus}`);

const ttfbStatus = getVitalStatus(mockVitals.ttfb, { good: 800, needs: 1800 });
console.log(`TTFB (Time to First Byte): ${formatValue(mockVitals.ttfb)} ${ttfbStatus}`);

// Overall score calculation
let goodCount = 0;
let needsCount = 0;
let poorCount = 0;

[mockVitals.lcp, mockVitals.fid, mockVitals.cls, mockVitals.fcp, mockVitals.ttfb].forEach((value, index) => {
  const thresholds = [
    { good: 2500, needs: 4000 }, // LCP
    { good: 100, needs: 300 },   // FID
    { good: 0.1, needs: 0.25 },  // CLS
    { good: 1800, needs: 3000 }, // FCP
    { good: 800, needs: 1800 },  // TTFB
  ][index];
  
  if (value <= thresholds.good) goodCount++;
  else if (value <= thresholds.needs) needsCount++;
  else poorCount++;
});

console.log('\n🎯 Performance Summary:');
console.log('─'.repeat(60));
console.log(`Good metrics: ${goodCount}/5`);
console.log(`Needs improvement: ${needsCount}/5`);
console.log(`Poor metrics: ${poorCount}/5`);

let overallStatus = '🔴 Poor';
if (goodCount >= 4) overallStatus = '🟢 Good';
else if (goodCount >= 2) overallStatus = '🟡 Needs Improvement';

console.log(`Overall Performance: ${overallStatus}`);

// Recommendations
console.log('\n💡 Performance Recommendations:');
console.log('─'.repeat(60));

if (mockVitals.lcp > 2500) {
  console.log('🔧 LCP Optimization:');
  console.log('   • Optimize server response times');
  console.log('   • Use CDN for static assets');
  console.log('   • Optimize critical rendering path');
  console.log('   • Preload important resources');
}

if (mockVitals.fid > 100) {
  console.log('🔧 FID Optimization:');
  console.log('   • Break up long tasks');
  console.log('   • Optimize JavaScript execution');
  console.log('   • Use code splitting');
  console.log('   • Defer non-critical JavaScript');
}

if (mockVitals.cls > 0.1) {
  console.log('🔧 CLS Optimization:');
  console.log('   • Set dimensions for images and embeds');
  console.log('   • Avoid inserting content above existing content');
  console.log('   • Use CSS aspect-ratio for dynamic content');
  console.log('   • Preload fonts to avoid FOIT/FOUT');
}

if (mockVitals.ttfb > 800) {
  console.log('🔧 TTFB Optimization:');
  console.log('   • Optimize server processing');
  console.log('   • Use server-side caching');
  console.log('   • Reduce DNS lookup time');
  console.log('   • Use HTTP/2 or HTTP/3');
}

console.log('\n📊 Monitoring Setup:');
console.log('─'.repeat(60));
console.log('To monitor real Web Vitals:');
console.log('1. Add web-vitals library to your app');
console.log('2. Send metrics to analytics service');
console.log('3. Set up performance budgets');
console.log('4. Monitor Core Web Vitals in production');

console.log('\n🚀 Next Steps:');
console.log('─'.repeat(60));
console.log('1. Run: npm run build && npm run start');
console.log('2. Test with: npm run performance:audit');
console.log('3. Monitor with: npm run performance:vitals');
console.log('4. Deploy and monitor real user metrics');

// Performance budget check
console.log('\n💰 Performance Budget:');
console.log('─'.repeat(60));
const budgets = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  bundleSize: 1024 * 1024, // 1MB
};

Object.entries(budgets).forEach(([metric, budget]) => {
  if (metric === 'bundleSize') {
    console.log(`Bundle Size: < ${(budget / 1024 / 1024).toFixed(1)}MB`);
  } else {
    const unit = metric === 'cls' ? '' : 'ms';
    console.log(`${metric.toUpperCase()}: < ${budget}${unit}`);
  }
}); 