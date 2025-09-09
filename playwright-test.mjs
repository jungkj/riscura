import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBackgroundAnimation() {
  let browser;
  
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Open the local HTML file
    const filePath = 'file://' + resolve(__dirname, 'test-background.html');
    console.log('Opening file:', filePath);
    
    await page.goto(filePath, { waitUntil: 'domcontentloaded' });
    
    // Wait for any initial loading
    await page.waitForTimeout(1000);
    
    // Take initial screenshot
    console.log('Taking first screenshot...');
    await page.screenshot({ 
      path: 'sky-animation-1.png',
      fullPage: false 
    });
    
    // Wait for animation to progress
    console.log('Waiting for animations to progress (3 seconds)...');
    await page.waitForTimeout(3000);
    
    // Take second screenshot
    console.log('Taking second screenshot...');
    await page.screenshot({ 
      path: 'sky-animation-2.png',
      fullPage: false 
    });
    
    // Wait more and take third screenshot
    console.log('Waiting longer for more animation (5 seconds)...');
    await page.waitForTimeout(5000);
    
    // Take third screenshot
    console.log('Taking third screenshot...');
    await page.screenshot({ 
      path: 'sky-animation-3.png',
      fullPage: false 
    });
    
    // Analyze page content and animations
    const pageInfo = await page.evaluate(() => {
      const vantaEl = document.querySelector('.vanta-background');
      const atmosphericEl = document.querySelector('.atmospheric-layer');
      const contentEl = document.querySelector('.content');
      
      // Get computed styles
      const vantaStyle = vantaEl ? window.getComputedStyle(vantaEl) : null;
      const atmosphericStyle = atmosphericEl ? window.getComputedStyle(atmosphericEl) : null;
      
      return {
        pageTitle: document.title,
        hasVantaBackground: !!vantaEl,
        hasAtmosphericLayer: !!atmosphericEl,
        hasContent: !!contentEl,
        contentText: contentEl ? contentEl.textContent.trim() : null,
        vantaAnimation: vantaStyle ? vantaStyle.animation : null,
        atmosphericAnimation: atmosphericStyle ? atmosphericStyle.animation : null,
        backgroundProperty: vantaStyle ? vantaStyle.background.substring(0, 100) + '...' : null,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    console.log('\n=== PAGE ANALYSIS ===');
    console.log('Page Title:', pageInfo.pageTitle);
    console.log('Has Vanta Background:', pageInfo.hasVantaBackground);
    console.log('Has Atmospheric Layer:', pageInfo.hasAtmosphericLayer);
    console.log('Content Text:', pageInfo.contentText);
    console.log('Vanta Animation:', pageInfo.vantaAnimation);
    console.log('Atmospheric Animation:', pageInfo.atmosphericAnimation);
    console.log('Background Property (first 100 chars):', pageInfo.backgroundProperty);
    console.log('Viewport:', pageInfo.viewport);
    
    console.log('\n=== SCREENSHOTS TAKEN ===');
    console.log('1. sky-animation-1.png (initial state)');
    console.log('2. sky-animation-2.png (after 3 seconds)');
    console.log('3. sky-animation-3.png (after 8 seconds total)');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}

console.log('Starting background animation test...');
testBackgroundAnimation().then(() => {
  console.log('Test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});