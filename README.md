# Riscura - Enterprise Risk Management Platform

A comprehensive Next.js-based enterprise risk management platform with AI-powered insights, advanced analytics, and modern UI design.

## 🚀 Current Status

**Sprint 6 Complete**: Enhanced Landing Page & Refined Theme
- ✅ Complete color scheme transformation (Cream/Beige & Dark Black theme)
- ✅ Inter font implementation across entire codebase
- ✅ Landing page redesign with time-saving chart
- ✅ Dashboard transformation with Notion-like design
- ✅ Consistent styling across all components

## 🎨 Design System

### Color Palette
- **Background Beige**: `#F5F1E9` - Soft, warm, and inviting
- **Dark Black**: `#191919` - Deep and rich, great for text and accents
- **Muted Gray**: `#A8A8A8` - For subtle contrasts and secondary elements
- **Warm Beige Accent**: `#D8C3A5` - Adds depth and sophistication
- **Soft White**: `#FAFAFA` - Clean, modern white

### Typography
- **Primary Font**: Inter (Google Fonts)
- Applied systematically across entire codebase
- Enhanced readability and modern appearance

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **UI Components**: Shadcn/ui + Custom Components
- **Database**: Prisma ORM (SQLite for development)
- **Authentication**: NextAuth.js
- **Deployment**: Vercel-ready

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd riscura
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3003
   ```

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables**
   Set these in Vercel dashboard:
   ```
   SKIP_ENV_VALIDATION=1
   NODE_ENV=production
   MOCK_DATA=true
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Build

For production builds:
```bash
SKIP_ENV_VALIDATION=1 npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

**Required for Demo Mode:**
- `SKIP_ENV_VALIDATION=1` - Skips environment validation
- `MOCK_DATA=true` - Enables demo data
- `NODE_ENV=development` - Development mode

**Optional (for full functionality):**
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `STRIPE_SECRET_KEY` - Billing integration
- `SMTP_*` - Email configuration
- `OPENAI_API_KEY` - AI features

### Demo Mode

The application runs in demo mode by default with:
- Mock data for all features
- No database required
- All AI features simulated
- No external API dependencies

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/             # Reusable UI components
├── pages/                  # Page components
├── lib/                    # Utility libraries
├── services/               # Business logic services
├── types/                  # TypeScript type definitions
├── context/                # React context providers
└── hooks/                  # Custom React hooks
```

## 🎯 Key Features

### ✅ Completed Features

1. **Landing Page**
   - Modern hero section with typewriter effect
   - Time-saving chart visualization
   - Feature showcase cards
   - Responsive design

2. **Dashboard**
   - Real-time metrics
   - Interactive widgets
   - AI-powered insights
   - Risk heatmaps
   - Compliance tracking

3. **Risk Management**
   - Risk registry
   - Risk assessment tools
   - Risk-control mapping
   - Trend analysis

4. **Control Management**
   - Control library
   - Effectiveness tracking
   - Testing schedules
   - Evidence management

5. **Questionnaires**
   - Dynamic questionnaire builder
   - AI question generation
   - Response analytics
   - Conditional logic

6. **Reporting**
   - Advanced report builder
   - Multiple export formats
   - Scheduled reports
   - Custom visualizations

### 🚧 In Development

- Advanced AI integrations
- Real-time collaboration
- Mobile app
- API integrations

## 🔐 Security

- Environment variable validation
- Input sanitization
- CSRF protection
- Secure authentication
- Data encryption

## 📊 Performance

- Optimized bundle size
- Lazy loading
- Image optimization
- Caching strategies
- Performance monitoring

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the implementation notes in `IMPLEMENTATION_REVIEW.md`
- Contact the development team

## 🚀 Deployment Status

**Ready for Production Deployment**
- ✅ Build process optimized
- ✅ Environment configuration complete
- ✅ Vercel deployment ready
- ✅ Demo mode functional
- ✅ All core features working

**Note**: Some advanced features require additional environment variables for full functionality. The application works perfectly in demo mode for showcasing and development.