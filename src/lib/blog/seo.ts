import { Metadata } from 'next';
import { BlogPostMeta } from './mdx';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://riscura.com';

export function generateBlogPostMetadata(post: BlogPostMeta): Metadata {
  const title = `${post.title} | Riscura Blog`;
  const description = post.seo.metaDescription || post.excerpt;
  const url = `${baseUrl}/blog/${post.slug}`;
  const imageUrl = post.featuredImage.src.startsWith('http') 
    ? post.featuredImage.src 
    : `${baseUrl}${post.featuredImage.src}`;

  return {
    title,
    description,
    keywords: post.seo.keywords.join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: 'Riscura',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.featuredImage.alt,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [imageUrl],
      creator: '@riscura',
    },
    alternates: {
      canonical: post.seo.canonicalUrl || url,
      types: {
        'application/rss+xml': `${baseUrl}/blog/rss.xml`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateBlogListingMetadata(category?: string): Metadata {
  const title = category 
    ? `${category} Articles | Riscura Blog` 
    : 'Blog | Risk Management Insights for Small Teams | Riscura';
  
  const description = category
    ? `Expert insights and guides on ${category.toLowerCase()} for small business risk management.`
    : 'Expert insights on risk management, compliance, and GRC for small teams. Learn how to migrate from Excel to automated risk management.';

  return {
    title,
    description,
    keywords: 'risk management blog, RCSA guide, GRC software, compliance automation, small business risk management',
    openGraph: {
      title,
      description,
      url: category ? `${baseUrl}/blog/category/${category}` : `${baseUrl}/blog`,
      siteName: 'Riscura',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@riscura',
    },
    alternates: {
      canonical: category ? `${baseUrl}/blog/category/${category}` : `${baseUrl}/blog`,
      types: {
        'application/rss+xml': `${baseUrl}/blog/rss.xml`,
      },
    },
  };
}

export function generateStructuredData(post: BlogPostMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage.src,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      description: post.author.bio,
      sameAs: post.author.linkedin,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Riscura',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    articleSection: post.category,
    wordCount: post.readingTime?.words,
  };
}