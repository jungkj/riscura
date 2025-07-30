const { categories } = require('./src/lib/blog/mdx');

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://riscura.com',
  generateRobotsTxt: false, // We already have a custom robots.txt
  generateIndexSitemap: true,
  exclude: [
    '/dashboard/*',
    '/admin/*',
    '/api/*',
    '/404',
    '/500',
    '/auth/*',
    '/signup',
    '/login',
  ],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  
  // Additional paths with specific configurations
  additionalPaths: async (config) => {
    const result = [];
    
    // Add blog categories with higher priority
    // Transform categories to URL-friendly slugs
    const categorySlug = categories.map(category => 
      category.toLowerCase().replace(/\s+/g, '-')
    );
    
    categorySlug.forEach((slug) => {
      result.push({
        loc: `/blog/category/${slug}`,
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
    
    return result;
  },
  
  transform: async (config, path) => {
    // Custom transformation for specific paths
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }
    
    if (path.startsWith('/blog/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }
    
    if (path === '/resources' || path === '/demo') {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }
    
    // Default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};