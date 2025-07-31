'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog/mdx';

interface BlogGridProps {
  posts: BlogPost[];
}

export default function BlogGrid({ posts }: BlogGridProps) {
  if (posts.length === 0) {

  return (
    <div className="text-center py-12">
        <p className="text-gray-600">No articles found.</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
          <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
            <div className="relative h-48">
              <Image
                src={post.featuredImage.src}
                alt={post.featuredImage.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {post.category}
                </span>
                <span className="text-gray-500 text-sm">
                  {post.readingTime?.text}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                {post.excerpt}
              </p>
              <div className="flex items-center mt-auto">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  className="rounded-full mr-3"
                />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {post.author.name}
                  </p>
                  <p className="text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}