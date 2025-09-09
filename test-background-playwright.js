const { chromium } = require('playwright');
const path = require('path');

async function testBackgroundAnimation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Open the local HTML file
    const filePath = 'file://' + path.resolve('C:\\Users\\andy.jung\\riscura\\test-background.html');
    console.log('Opening file:', filePath);
    
    await page.goto(filePath);
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Give animations time to start and be visible
    console.log('Waiting for animations to initialize...');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'background-animation-screenshot-1.png',
      fullPage: true 
    });
    console.log('First screenshot taken: background-animation-screenshot-1.png');
    
    // Wait a bit more to capture animation in different state
    console.log('Waiting for animation progression...');
    await page.waitForTimeout(2000);
    
    // Take second screenshot to compare animation states
    await page.screenshot({ 
      path: 'background-animation-screenshot-2.png',
      fullPage: true 
    });
    console.log('Second screenshot taken: background-animation-screenshot-2.png');
    
    // Get page dimensions and basic info
    const dimensions = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      title: document.title,
      bodyContent: document.body ? document.body.innerHTML.substring(0, 200) + '...' : 'No body content'
    }));
    
    console.log('Page dimensions:', dimensions);
    
    // Check if there are any CSS animations or transforms active
    const animationInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const animatedElements = [];
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const animation = computedStyle.animation;
        const transform = computedStyle.transform;
        
        if (animation !== 'none' || transform !== 'none') {
          animatedElements.push({
            tagName: el.tagName,
            className: el.className,
            animation: animation,
            transform: transform
          });
        }
      });
      
      return {
        totalElements: elements.length,
        animatedElements: animatedElements,
        hasCanvas: document.querySelector('canvas') ? true : false,
        hasVideo: document.querySelector('video') ? true : false
      };
    });
    
    console.log('Animation analysis:', JSON.stringify(animationInfo, null, 2));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testBackgroundAnimation();