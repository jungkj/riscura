'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  BookmarkPlus,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug;

  // This would typically come from a CMS or database
  const blogPost = {
    id: 'rcsa-automation-revolution',
    title: 'The RCSA Revolution: How We Automated the Most Tedious Process in Risk Management',
    excerpt: 'Discover how Riscura transformed the manual, error-prone RCSA process from weeks of Excel hell into minutes of intelligent automation.',
    content: `
# The RCSA Revolution: How We Automated the Most Tedious Process in Risk Management

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
\`\`\`typescript
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
\`\`\`

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
    featured: true
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-4xl font-bold text-gray-900 mb-8 mt-12">{line.substring(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="text-3xl font-semibold text-gray-900 mb-6 mt-10">{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} className="text-2xl font-semibold text-gray-900 mb-4 mt-8">{line.substring(4)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="text-gray-700 mb-2 ml-4">{line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>;
      } else if (line.includes('```')) {
        return null; // Handle code blocks separately
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else if (line.includes('*"') && line.includes('"*')) {
        return <blockquote key={index} className="border-l-4 border-[#199BEC] pl-6 my-6 text-lg italic text-gray-700">{line.replace(/\*"(.*?)"\*/g, '"$1"')}</blockquote>;
      } else {
        const processedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return <p key={index} className="text-gray-700 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: processedLine }} />;
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <BookmarkPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex flex-wrap gap-2 mb-6">
            {blogPost.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blogPost.title}
          </h1>
          
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#199BEC] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{blogPost.author}</div>
                <div className="text-gray-600">{blogPost.authorRole}</div>
              </div>
            </div>
            <div className="text-right text-gray-500">
              <div className="flex items-center space-x-1 mb-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(blogPost.publishDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{blogPost.readTime}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Article Body */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="prose prose-lg max-w-none"
        >
          <div className="text-xl text-gray-700 mb-8 leading-relaxed font-light">
            {blogPost.excerpt}
          </div>
          
          <div className="space-y-4">
            {formatContent(blogPost.content)}
          </div>
        </motion.div>

        {/* Social Sharing */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share this article</h3>
              <div className="flex space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 p-8 bg-gradient-to-r from-[#199BEC] to-purple-600 rounded-2xl text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Ready to Automate Your RCSA Process?</h3>
          <p className="text-lg mb-6 opacity-90">
            See how Riscura can transform your risk management workflow in minutes, not weeks.
          </p>
          <Button 
            size="lg" 
            className="px-8 py-4 bg-white text-[#199BEC] hover:bg-gray-100"
            onClick={() => window.location.href = '/auth/register'}
          >
            Schedule a Personalized Demo
          </Button>
        </motion.div>
      </article>
    </div>
  );
}
