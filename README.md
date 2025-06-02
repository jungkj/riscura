# Riscura RCSA Platform

A comprehensive Risk & Control Self-Assessment (RCSA) platform built with Next.js 14, TypeScript, and PostgreSQL. Features AI-powered risk analysis, real-time collaboration, and enterprise-grade security.

## 🚀 Features

### Core Functionality
- **Risk Management**: Comprehensive risk identification, assessment, and mitigation tracking
- **Control Management**: Design, implement, and monitor controls with effectiveness ratings
- **Document Management**: Secure document storage with AI-powered content analysis
- **Workflow Automation**: Customizable approval workflows and task management
- **Questionnaires**: Dynamic questionnaire builder for assessments and audits
- **Reporting & Analytics**: Real-time dashboards and customizable reports

### AI-Powered Features
- **ARIA AI Assistant**: Context-aware AI assistant with specialized agents
  - Risk Analyzer: Automated risk assessment and recommendations
  - Control Advisor: Control design and effectiveness optimization
  - Compliance Expert: Regulatory compliance guidance
- **Document Intelligence**: Automatic document analysis and risk/control extraction
- **Predictive Analytics**: ML-powered risk forecasting and trend analysis

### Enterprise Features
- **Multi-tenancy**: Complete organization isolation with role-based access control
- **Real-time Collaboration**: WebSocket-powered real-time updates and notifications
- **Advanced Security**: 
  - AES-256 encryption at rest
  - TLS 1.3 for data in transit
  - Field-level encryption for sensitive data
  - Comprehensive audit logging
- **Billing & Subscriptions**: Stripe integration for subscription management
- **API Access**: RESTful API with rate limiting and API key management

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React Context API
- **Real-time**: WebSocket client

### Backend
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Caching**: Redis
- **File Storage**: AWS S3
- **Email**: SendGrid/AWS SES
- **Payments**: Stripe

### DevOps & Infrastructure
- **Deployment**: Docker + PM2
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Analytics**: Google Analytics + Mixpanel

## 📋 Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 6+ (optional for development)
- npm or yarn

## 🏃‍♂️ Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-org/riscura.git
cd riscura
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

### 4. Set up the database
```bash
# Create database
createdb riscura_dev

# Run migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed
```

### 5. Start the development server
```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) to see the application.

### 6. Default credentials (from seed data)
- Admin: `admin@riscura-demo.com` / `demo123`
- Risk Manager: `riskmanager@riscura-demo.com` / `demo123`
- Auditor: `auditor@riscura-demo.com` / `demo123`
- User: `user@riscura-demo.com` / `demo123`

## 📁 Project Structure

```
riscura/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   └── dashboard/      # Dashboard pages
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...            # Feature-specific components
│   ├── lib/               # Core libraries
│   │   ├── auth/          # Authentication logic
│   │   ├── api/           # API utilities
│   │   ├── db.ts          # Database client
│   │   └── ...            # Other utilities
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── context/           # React context providers
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── public/               # Static assets
└── docs/                # Documentation
```

## 🔧 Configuration

### Environment Variables
See `env.example` for all available configuration options. Key variables include:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Secret for JWT tokens
- `MASTER_ENCRYPTION_KEY`: Key for data encryption
- `STRIPE_SECRET_KEY`: Stripe API key (for billing)
- `OPENAI_API_KEY`: OpenAI API key (for AI features)

### Database Schema
The application uses Prisma ORM with PostgreSQL. Key models include:
- Organizations (multi-tenancy)
- Users (with roles and permissions)
- Risks, Controls, Documents
- Workflows, Tasks, Questionnaires
- Audit logs and activity tracking

## 🚀 Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

### Quick deployment with Docker:
```bash
# Build the image
docker build -t riscura .

# Run with Docker Compose
docker-compose up -d
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📚 API Documentation

The API follows RESTful conventions with comprehensive error handling and validation.

### Authentication
```bash
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
```

### Resources
```bash
GET    /api/risks
POST   /api/risks
GET    /api/risks/:id
PUT    /api/risks/:id
DELETE /api/risks/:id

# Similar endpoints for:
# - /api/controls
# - /api/documents
# - /api/questionnaires
# - /api/workflows
# - /api/reports
```

## 🔐 Security

- **Authentication**: JWT-based with secure refresh token rotation
- **Authorization**: Role-based access control (RBAC) with granular permissions
- **Encryption**: AES-256-GCM for data at rest, TLS 1.3 for data in transit
- **Input Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Configurable per-endpoint rate limits
- **CSRF Protection**: Token-based CSRF protection
- **SQL Injection**: Protected via Prisma's parameterized queries
- **XSS Protection**: Content Security Policy headers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- Documentation: [https://docs.riscura.com](https://docs.riscura.com)
- Email: support@riscura.com
- Issues: [GitHub Issues](https://github.com/your-org/riscura/issues)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components

---

Built with ❤️ by the Riscura team