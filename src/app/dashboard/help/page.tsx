'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Search,
  Book,
  Video,
  MessageSquare,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  Star,
  Zap,
  Shield,
  BarChart3,
  Users
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  readTime: string;
  helpful: number;
  icon: React.ComponentType<any>;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Riscura',
    category: 'Basics',
    description: 'Learn the fundamentals of risk management in Riscura',
    readTime: '5 min',
    helpful: 127,
    icon: Zap
  },
  {
    id: '2',
    title: 'Creating Your First Risk Assessment',
    category: 'Risk Management',
    description: 'Step-by-step guide to creating and managing risk assessments',
    readTime: '8 min',
    helpful: 98,
    icon: Shield
  },
  {
    id: '3',
    title: 'Understanding Compliance Frameworks',
    category: 'Compliance',
    description: 'Overview of SOC 2, ISO 27001, and other frameworks',
    readTime: '10 min',
    helpful: 76,
    icon: FileText
  },
  {
    id: '4',
    title: 'Working with Controls',
    category: 'Controls',
    description: 'How to implement and manage security controls effectively',
    readTime: '7 min',
    helpful: 64,
    icon: Shield
  },
  {
    id: '5',
    title: 'Analytics and Reporting',
    category: 'Analytics',
    description: 'Generate insights and reports from your risk data',
    readTime: '6 min',
    helpful: 52,
    icon: BarChart3
  },
  {
    id: '6',
    title: 'Team Collaboration',
    category: 'Collaboration',
    description: 'Invite team members and manage permissions',
    readTime: '4 min',
    helpful: 41,
    icon: Users
  }
];

const faqs: FAQ[] = [
  {
    question: 'How do I create a new risk assessment?',
    answer: 'Navigate to Quick Actions > New Risk Assessment or click the "+" button in the Risk Register. Follow the guided workflow to document your risk.',
    category: 'Risk Management'
  },
  {
    question: 'Can I import existing risk data?',
    answer: 'Yes! Go to Quick Actions > Import Data. We support CSV, Excel, and JSON formats. Download our templates for the correct format.',
    category: 'Data Management'
  },
  {
    question: 'How often should I review my risks?',
    answer: 'Best practice is to review high and critical risks monthly, medium risks quarterly, and low risks annually. Set up automated reminders in the platform.',
    category: 'Risk Management'
  },
  {
    question: 'What compliance frameworks are supported?',
    answer: 'Riscura supports SOC 2, ISO 27001, GDPR, HIPAA, PCI DSS, and custom frameworks. You can map controls across multiple frameworks.',
    category: 'Compliance'
  },
  {
    question: 'How do I generate a compliance report?',
    answer: 'Go to Quick Actions > Generate Report, select your framework and time period, then choose the sections to include. Reports can be exported as PDF, Excel, or Word.',
    category: 'Reporting'
  },
  {
    question: 'Can I customize the risk scoring methodology?',
    answer: 'Yes, administrators can customize risk scoring matrices, likelihood and impact scales, and calculation methods in Settings > Risk Configuration.',
    category: 'Configuration'
  }
];

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredArticles = helpArticles.filter(article =>
    (selectedCategory === 'all' || article.category === selectedCategory) &&
    (article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     article.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(helpArticles.map(a => a.category)));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
                <p className="text-gray-600 mt-1">Find answers and learn how to use Riscura effectively</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search help articles and FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList>
              <TabsTrigger value="articles">Help Articles</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
              <TabsTrigger value="contact">Contact Support</TabsTrigger>
            </TabsList>

            {/* Help Articles */}
            <TabsContent value="articles">
              {/* Category Filter */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map(article => (
                  <Card
                    key={article.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/help/article/${article.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <article.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {article.helpful} found helpful
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                    <p className="text-gray-600">Try adjusting your search or category filter</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* FAQs */}
            <TabsContent value="faqs">
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {faq.question}
                          </h3>
                          <p className="text-gray-600">
                            {faq.answer}
                          </p>
                          <Badge variant="outline" className="mt-3 text-xs">
                            {faq.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No FAQs found</h3>
                    <p className="text-gray-600">Try a different search term</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Video Tutorials */}
            <TabsContent value="videos">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Platform Overview
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      5-minute introduction to Riscura's key features
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">5:23</span>
                      <Button size="sm" variant="outline">
                        Watch
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Risk Assessment Tutorial
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Complete walkthrough of the risk assessment process
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">12:45</span>
                      <Button size="sm" variant="outline">
                        Watch
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Compliance Management
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Managing frameworks and generating compliance reports
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">8:17</span>
                      <Button size="sm" variant="outline">
                        Watch
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Contact Support */}
            <TabsContent value="contact">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get in Touch</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Email Support</p>
                        <a href="mailto:support@riscura.com" className="text-sm text-blue-600 hover:underline">
                          support@riscura.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Phone Support</p>
                        <p className="text-sm text-gray-600">1-800-RISCURA (Mon-Fri 9am-5pm EST)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-gray-600">Available during business hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Support Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 5:00 PM EST</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Saturday</span>
                        <span className="font-medium">10:00 AM - 2:00 PM EST</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Sunday</span>
                        <span className="font-medium">Closed</span>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-900 mb-1">
                        Priority Support
                      </p>
                      <p className="text-sm text-orange-800">
                        Enterprise customers have 24/7 priority support
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}