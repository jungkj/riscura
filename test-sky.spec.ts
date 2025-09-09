import { test, expect } from '@playwright/test';

test('Sky Animation Test', async ({ page }) => {
  // Open the local HTML file
  await page.goto('file:///C:/Users/andy.jung/riscura/test-background.html');
  
  // Wait for the page to load
  await page.waitForLoadState('domcontentloaded');
  
  // Take initial screenshot
  await page.screenshot({ path: 'sky-animation-initial.png' });
  
  // Wait for animations to start and progress
  await page.waitForTimeout(3000);
  
  // Take second screenshot after animation has had time to change
  await page.screenshot({ path: 'sky-animation-3sec.png' });
  
  // Wait more for further animation progression
  await page.waitForTimeout(5000);
  
  // Take final screenshot
  await page.screenshot({ path: 'sky-animation-8sec.png' });
  
  // Verify page elements exist
  const vantaBackground = await page.locator('.vanta-background');
  await expect(vantaBackground).toBeVisible();
  
  const atmosphericLayer = await page.locator('.atmospheric-layer');
  await expect(atmosphericLayer).toBeVisible();
  
  const content = await page.locator('.content');
  await expect(content).toBeVisible();
  
  // Check that animations are applied
  const animationStyle = await vantaBackground.evaluate(el => {
    const computedStyle = window.getComputedStyle(el);
    return {
      animation: computedStyle.animation,
      backgroundPosition: computedStyle.backgroundPosition,
      background: computedStyle.background.substring(0, 100) + '...'
    };
  });
  
  console.log('Animation properties:', animationStyle);
  
  // Verify content text
  await expect(content).toContainText('Palace.so Inspired Sky Animation Test');
  
  console.log('Screenshots taken:');
  console.log('- sky-animation-initial.png');
  console.log('- sky-animation-3sec.png');
  console.log('- sky-animation-8sec.png');
});