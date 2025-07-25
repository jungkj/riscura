import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrismPlus from 'rehype-prism-plus';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
    linkedin?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  featuredImage: {
    src: string;
    alt: string;
    blurDataURL?: string;
  };
  seo: {
    metaDescription: string;
    keywords: string[];
    canonicalUrl?: string;
  };
  readingTime?: {
    text: string;
    minutes: number;
    time: number;
    words: number;
  };
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  mdxSource?: any;
}

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory).filter(file => file.endsWith('.mdx'));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const timeToRead = readingTime(content);
  
  return {
    ...data,
    slug: realSlug,
    content,
    readingTime: timeToRead,
  } as BlogPost;
}

export async function getSerializedPost(slug: string) {
  const post = getPostBySlug(slug);
  if (!post) return null;

  const mdxSource = await serialize(post.content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, [rehypePrismPlus, { showLineNumbers: true }]],
    },
  });

  return {
    ...post,
    mdxSource,
  };
}

export function getAllPosts(): BlogPost[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug.replace(/\.mdx$/, '')))
    .filter((post): post is BlogPost => post !== null)
    .sort((post1, post2) => (post1.publishedAt > post2.publishedAt ? -1 : 1));
  
  return posts;
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  );
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return [];

  const allPosts = getAllPosts().filter(post => post.slug !== currentSlug);
  
  // Score posts based on shared tags and category
  const scoredPosts = allPosts.map(post => {
    let score = 0;
    
    // Same category gets higher score
    if (post.category === currentPost.category) score += 3;
    
    // Shared tags
    const sharedTags = post.tags.filter(tag => currentPost.tags.includes(tag));
    score += sharedTags.length * 2;
    
    return { post, score };
  });
  
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}

export const categories = [
  'Risk Management Basics',
  'Excel to GRC Migration',
  'Compliance Guides',
  'Small Business Resources',
  'Product Updates',
  'Industry Insights',
  'Best Practices',
  'Case Studies',
] as const;

export type Category = typeof categories[number];