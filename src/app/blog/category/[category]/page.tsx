import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostsByCategory, categories } from '@/lib/blog/mdx';
import { generateBlogListingMetadata } from '@/lib/blog/seo';
import BlogGrid from '@/components/blog/BlogGrid';
import NewsletterCTA from '@/components/blog/NewsletterCTA';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateStaticParams() {
  return categories.map((category) => ({
    category: category.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categorySlug = params.category;
  const category = categories.find(
    (cat) => cat.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );

  if (!category) {
    return {
      title: 'Category Not Found | Riscura Blog',
      description: 'The requested category could not be found.',
    };
  }

  return generateBlogListingMetadata(category);
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const categorySlug = params.category;
  const category = categories.find(
    (cat) => cat.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );

  if (!category) {
    notFound();
  }

  const posts = getPostsByCategory(category);

  return (
    <>
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/blog" className="text-gray-600 hover:text-gray-900">
            Blog
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">{category}</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{category}</h1>

        <p className="text-xl text-gray-600 max-w-3xl">{getCategoryDescription(category)}</p>
      </header>

      {/* Category Filter */}
      <section className="mb-12">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            All Articles
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`}
              className={`px-4 py-2 rounded-lg transition-colors ${
                cat === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="mb-16">
        <BlogGrid posts={posts} />
      </section>

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </>
  );
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'Risk Management Basics':
      'Fundamental concepts and strategies for effective risk management in small to medium businesses.',
    'Excel to GRC Migration':
      'Learn how to transition from spreadsheet-based risk management to automated GRC solutions.',
    'Compliance Guides':
      'Comprehensive guides for navigating various compliance frameworks and regulations.',
    'Small Business Resources':
      'Practical resources and tools designed specifically for small business risk management needs.',
    'Product Updates':
      'Latest features, improvements, and announcements about the Riscura platform.',
    'Industry Insights':
      'Expert analysis and trends in the risk management and compliance industry.',
    'Best Practices':
      'Proven strategies and methodologies for optimizing your risk management processes.',
    'Case Studies':
      'Real-world examples of successful risk management implementations and transformations.',
  };

  return descriptions[category] || `Articles and insights about ${category.toLowerCase()}.`;
}
