import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog/mdx';

interface RelatedPostsProps {
  posts: BlogPost[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {

  return (
    <section className="mb-12">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
            <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40">
                <Image
                  src={post.featuredImage.src}
                  alt={post.featuredImage.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {post.category}
                </span>
                <h4 className="text-lg font-semibold text-gray-900 mt-2 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-sm text-gray-500">
                  {post.readingTime?.text} • {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}