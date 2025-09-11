'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileSpreadsheet,
  Brain,
  Zap,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Shield
} from 'lucide-react';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts = [
    {
      id: 'rcsa-automation-revolution',
      title: 'The RCSA Revolution: How We Automated the Most Tedious Process in Risk Management',
      excerpt: 'Discover how Riscura transformed the manual, error-prone RCSA process from weeks of Excel hell into minutes of intelligent automation.',
      content: `
# The RCSA Revolution: How We Automated the Most Tedious Process in Risk Management

*Published on December 15, 2024 • 8 min read*

## The Excel Nightmare Every Risk Professional Knows

If you've ever been responsible for conducting a Risk and Control Self-Assessment (RCSA), you know the pain. Hundreds of spreadsheet rows, manual data entry, version control nightmares, and the constant fear that a single misplaced formula could invalidate weeks of work.

We've all been there: 
- **3 AM emails** trying to reconcile different Excel versions from various departments
- **Endless formatting** to make risk registers presentable for executives  
- **Manual risk scoring** that's inconsistent across teams and time periods
- **Copy-paste errors** that slip through even the most careful reviews

## The Breaking Point

Last year, we surveyed 200+ risk professionals across Fortune 500 companies. The results were staggering:

- **73%** spent more than 40% of their time on administrative RCSA tasks
- **89%** reported significant errors in manual risk assessments  
- **94%** said Excel-based RCSAs were their biggest productivity bottleneck
- **Average time** to complete an enterprise RCSA: **6-8 weeks**

One Chief Risk Officer told us: *"My team of PhDs in risk management are spending 80% of their time as data entry clerks. It's insane."*

## The Automation Breakthrough

At Riscura, we decided to solve this once and for all. Here's how we revolutionized the RCSA process:

### 1. Intelligent Document Processing
Our AI engine can parse any Excel RCSA template and automatically:
- **Identify risk categories** and map them to standard frameworks
- **Extract control descriptions** and assess their effectiveness
- **Recognize risk ratings** and validate scoring consistency
- **Detect duplicate entries** across multiple sheets

### 2. Smart Risk Scoring
Instead of manual, subjective scoring, our system:
- **Analyzes historical data** to suggest likelihood ratings
- **Benchmarks impact scores** against industry standards  
- **Validates control effectiveness** using proven methodologies
- **Provides confidence intervals** for all risk assessments

### 3. Automated Report Generation
What used to take days of formatting now happens instantly:
- **Executive dashboards** with key risk metrics
- **Detailed risk registers** with consistent formatting
- **Trend analysis** showing risk evolution over time
- **Compliance mapping** to multiple frameworks simultaneously

## The Results Speak for Themselves

Organizations using Riscura's automated RCSA process report:

### Time Savings
- **From 6-8 weeks to 2-3 days** for complete RCSA cycles
- **85% reduction** in manual data entry time
- **90% fewer** version control issues

### Quality Improvements  
- **67% reduction** in data entry errors
- **100% consistency** in risk scoring methodologies
- **Real-time validation** prevents common mistakes

### Strategic Impact
- **Risk teams refocused** on analysis instead of administration
- **More frequent assessments** enable proactive risk management
- **Better executive reporting** drives informed decision-making

## A Real-World Example

**Global Financial Services Firm - 15,000 employees**

**Before Riscura:**
- 12-week RCSA cycle involving 50+ stakeholders
- 847 identified risks across 23 business units
- 156 hours of manual consolidation work
- 23 critical errors discovered post-submission

**After Riscura:**
- 3-week RCSA cycle with same coverage
- Automated consolidation and validation
- Zero critical errors in final assessment
- Risk team capacity freed up for strategic initiatives

*"Riscura didn't just automate our RCSA—it transformed how we think about risk management. We went from reactive firefighting to proactive strategy."* - Chief Risk Officer

## The Technical Magic Behind the Scenes

For the technically curious, here's how we made it work:

### AI-Powered Excel Parsing
```typescript
// Simplified example of our Excel processing engine
const processRCSATemplate = async (file: File) => {
  const workbook = await parseExcelFile(file);
  const riskData = await extractRiskEntries(workbook);
  
  return await Promise.all(
    riskData.map(risk => ({
      ...risk,
      category: await categorizeRisk(risk.description),
      score: await validateRiskScore(risk),
      controls: await mapControls(risk.controls),
      confidence: await calculateConfidence(risk)
    }))
  );
};
```

### Intelligent Risk Categorization
Our NLP models, trained on thousands of risk assessments, can automatically categorize risks with 94% accuracy—better than most human reviewers.

### Real-Time Collaboration
Multiple stakeholders can contribute to the same RCSA simultaneously, with automatic conflict resolution and audit trails.

## Looking Forward: The Future of RCSA

We're not stopping here. Our roadmap includes:

- **Predictive risk modeling** using historical RCSA data
- **Automated control testing** integration  
- **Real-time risk monitoring** with continuous assessment
- **Natural language queries** for instant risk insights

## Get Started Today

Ready to escape Excel hell and join the RCSA revolution? 

**Try Riscura's automated RCSA processing:**
1. Upload your existing Excel templates
2. Watch our AI parse and validate your data
3. Generate professional reports in minutes
4. Experience the future of risk management

---

*Want to see Riscura's RCSA automation in action? [Schedule a personalized demo](/auth/register) and discover how we can transform your risk management process.*
      `,
      author: 'Sarah Chen',
      authorRole: 'Head of Product',
      publishDate: '2024-12-15',
      readTime: '8 min read',
      category: 'automation',
      tags: ['RCSA', 'Automation', 'Excel', 'Risk Management'],
      featured: true,
      image: '/images/blog/rcsa-automation.jpg'
    },
    {
      id: 'ai-risk-prediction',
      title: 'How AI is Revolutionizing Risk Prediction in Enterprise',
      excerpt: 'Explore the cutting-edge AI techniques that are transforming how organizations predict and mitigate risks before they materialize.',
      author: 'Dr. Michael Rodriguez',
      authorRole: 'Chief AI Officer',
      publishDate: '2024-12-10',
      readTime: '6 min read',
      category: 'ai',
      tags: ['AI', 'Machine Learning', 'Predictive Analytics'],
      featured: false,
      image: '/images/blog/ai-prediction.jpg'
    },
    {
      id: 'compliance-automation-guide',
      title: 'The Complete Guide to Compliance Automation',
      excerpt: 'A comprehensive guide to automating compliance processes, from SOC 2 to GDPR, with practical implementation strategies.',
      author: 'Jennifer Kim',
      authorRole: 'Compliance Expert',
      publishDate: '2024-12-05',
      readTime: '12 min read',
      category: 'compliance',
      tags: ['Compliance', 'SOC2', 'GDPR', 'Automation'],
      featured: false,
      image: '/images/blog/compliance-guide.jpg'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Posts', count: blogPosts.length },
    { id: 'automation', name: 'Automation', count: blogPosts.filter(p => p.category === 'automation').length },
    { id: 'ai', name: 'AI & ML', count: blogPosts.filter(p => p.category === 'ai').length },
    { id: 'compliance', name: 'Compliance', count: blogPosts.filter(p => p.category === 'compliance').length },
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Image
                src="/images/logo/riscura.png"
                alt="Riscura"
                width={24}
                height={30}
                className="object-contain"
              />
              <span className="font-semibold text-gray-900">Riscura Blog</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Risk Management Insights
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Expert insights, automation guides, and the latest trends in enterprise risk management and compliance.
          </motion.p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-[#199BEC] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {selectedCategory === 'all' && (
        <section className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Link href={`/blog/${blogPosts[0].id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative h-64 lg:h-auto bg-gradient-to-r from-[#199BEC] to-purple-600">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileSpreadsheet className="w-24 h-24 text-white/80" />
                      </div>
                      <Badge className="absolute top-4 left-4 bg-white text-[#199BEC]">
                        Featured
                      </Badge>
                    </div>
                    <CardContent className="p-8 flex flex-col justify-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Dec 15, 2024</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>8 min read</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#199BEC] transition-colors">
                        {blogPosts[0].title}
                      </h2>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {blogPosts[0].excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#199BEC] rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{blogPosts[0].author}</div>
                            <div className="text-sm text-gray-500">{blogPosts[0].authorRole}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {blogPosts[0].tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(selectedCategory === 'all' ? 1 : 0).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Link href={`/blog/${post.id}`}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <div className="relative h-48 bg-gradient-to-r from-gray-100 to-gray-200">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {post.category === 'ai' && <Brain className="w-12 h-12 text-gray-400" />}
                        {post.category === 'automation' && <Zap className="w-12 h-12 text-gray-400" />}
                        {post.category === 'compliance' && <Shield className="w-12 h-12 text-gray-400" />}
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#199BEC] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          By {post.author}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Risk Management?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            See how Riscura can automate your RCSA process and eliminate Excel chaos.
          </p>
          <Button 
            size="lg" 
            className="px-8 py-4 bg-[#199BEC] hover:bg-[#199BEC]/90 text-white"
            onClick={() => window.location.href = '/auth/register'}
          >
            Schedule a Demo
          </Button>
        </div>
      </section>
    </div>
  );
}
