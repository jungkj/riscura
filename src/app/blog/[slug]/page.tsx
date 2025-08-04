import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrismPlus from 'rehype-prism-plus';
import { getPostBySlug, getAllPosts, getRelatedPosts } from '@/lib/blog/mdx';
import { generateBlogPostMetadata, generateStructuredData } from '@/lib/blog/seo';
import AuthorBio from '@/components/blog/AuthorBio';
import TableOfContents from '@/components/blog/TableOfContents';
import ShareButtons from '@/components/blog/ShareButtons';
import RelatedPosts from '@/components/blog/RelatedPosts';
import NewsletterCTA from '@/components/blog/NewsletterCTA';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return {
      title: 'Post Not Found | Riscura Blog',
      description: 'The requested blog post could not be found.',
    };
  }
  return generateBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post.slug, 3);
  const structuredData = generateStructuredData(post);

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/blog/category/${encodeURIComponent(post.category.toLowerCase().replace(/\s+/g, '-'))}`}
              className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
            >
              {post.category}
            </Link>
            <span className="text-gray-500">•</span>
            <span className="text-gray-500 text-sm">{post.readingTime?.text}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{post.title}</h1>

          <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={48}
                height={48}
                className="rounded-full mr-4"
              />
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm text-gray-500">
                  Published on{' '}
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {post.updatedAt && post.updatedAt !== post.publishedAt && (
                    <span className="ml-2">
                      • Updated{' '}
                      {new Date(post.updatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ShareButtons url={`https://riscura.com/blog/${post.slug}`} title={post.title} />
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative h-96 mb-8 rounded-xl overflow-hidden">
          <Image
            src={post.featuredImage.src}
            alt={post.featuredImage.alt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <DaisyTableOfContents content={post.content} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900">
              <MDXRemote
                source={post.content}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [rehypeSlug, [rehypePrismPlus, { showLineNumbers: true }]],
                  },
                }}
              />
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-gray-600 font-medium">Tags:</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Author Bio */}
        <AuthorBio author={post.author} />

        {/* CTA Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-12 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Transform Your Risk Management?
          </h3>
          <p className="text-gray-600 mb-4">
            See how Riscura can help you migrate from Excel to intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Book a Demo
            </Link>
            <Link
              href="/resources/excel-template"
              className="bg-white text-blue-600 border border-blue-300 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Download Free Template
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}

        {/* Newsletter */}
        <NewsletterCTA />
      </article>
    </>
  );
}
