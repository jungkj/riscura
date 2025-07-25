import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, categories } from '@/lib/blog/mdx';
import { generateBlogListingMetadata } from '@/lib/blog/seo';
import BlogGrid from '@/components/blog/BlogGrid';
import NewsletterCTA from '@/components/blog/NewsletterCTA';

export const metadata: Metadata = generateBlogListingMetadata();

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPost = posts[0];
  const recentPosts = posts.slice(1);

  return (
    <>
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Risk Management Insights
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Expert guidance on transforming your Excel-based risk management into intelligent automation. 
          Learn best practices for small teams navigating compliance and GRC.
        </p>
      </header>

      {/* Featured Post */}
      {featuredPost && (
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Featured Article</h2>
          <Link href={`/blog/${featuredPost.slug}`} className="group">
            <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative h-64 md:h-full">
                  <Image
                    src={featuredPost.featuredImage.src}
                    alt={featuredPost.featuredImage.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {featuredPost.category}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {featuredPost.readingTime?.text}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center">
                    <Image
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {featuredPost.author.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(featuredPost.publishedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        </section>
      )}

      {/* Category Filter */}
      <section className="mb-12">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            All Articles
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/blog/category/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Posts Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Recent Articles</h2>
        <BlogGrid posts={recentPosts} />
      </section>

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </>
  );
}