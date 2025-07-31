import { NextResponse } from 'next/server';
import { Feed } from 'feed';
import { getAllPosts } from '@/lib/blog/mdx';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://riscura.com';

export async function GET() {
  const posts = getAllPosts();

  const feed = new Feed({
    title: 'Riscura Blog',
    description:
      'Expert insights on risk management, compliance, and GRC for small teams. Learn how to migrate from Excel to automated risk management.',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/images/riscura-logo.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Riscura`,
    updated: posts[0] ? new Date(posts[0].publishedAt) : new Date(),
    generator: 'Next.js using Feed',
    feedLinks: {
      rss2: `${baseUrl}/blog/rss.xml`,
      json: `${baseUrl}/blog/feed.json`,
      atom: `${baseUrl}/blog/atom.xml`,
    },
    author: {
      name: 'Riscura Team',
      email: 'hello@riscura.com',
      link: baseUrl,
    },
  });

  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: `${baseUrl}/blog/${post.slug}`,
      link: `${baseUrl}/blog/${post.slug}`,
      description: post.excerpt,
      content: post.excerpt, // You could include full content here if desired
      author: [
        {
          name: post.author.name,
          link: post.author.linkedin,
        },
      ],
      date: new Date(post.publishedAt),
      category: [
        {
          name: post.category,
        },
        ...post.tags.map((tag) => ({
          name: tag,
        })),
      ],
      image: post.featuredImage.src.startsWith('http')
        ? post.featuredImage.src
        : `${baseUrl}${post.featuredImage.src}`,
    });
  });

  const rss = feed.rss2();

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'max-age=3600, s-maxage=7200',
    },
  });
}
