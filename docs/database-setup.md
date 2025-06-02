# Database Setup Guide

## Overview
This guide covers the complete setup of the PostgreSQL database layer for Riscura using Prisma ORM.

## Prerequisites
- PostgreSQL 14+ installed and running
- Node.js 18+ 
- npm or yarn package manager

## Step 1: Environment Configuration

Create or update your `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/riscura_dev?schema=public"

# Authentication & Security
NEXTAUTH_SECRET="super-secret-nextauth-key-for-development-only-min-32-chars"
NEXTAUTH_URL="http://localhost:3001"
JWT_SECRET="super-secret-jwt-key-for-development-only-minimum-32-characters"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="super-secret-session-key-for-development-only-minimum-32-chars"
BCRYPT_ROUNDS="12"

# OpenAI API Configuration (required for AI features)
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_ORG_ID=""

# Application Configuration
NODE_ENV="development"
APP_URL="http://localhost:3001"
APP_NAME="Riscura"
PORT="3001"

# Email Configuration (optional for development)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@riscura.com"

# File Storage Configuration
UPLOAD_MAX_SIZE="10485760"
UPLOAD_ALLOWED_TYPES="pdf,docx,xlsx,png,jpg,jpeg"
STORAGE_TYPE="local"

# Feature Flags
ENABLE_AI_FEATURES="true"
ENABLE_COLLABORATION="true"
ENABLE_REAL_TIME="true"
ENABLE_EMAIL_NOTIFICATIONS="false"

# Development Settings
DEBUG_MODE="true"
MOCK_DATA="true"
SKIP_EMAIL_VERIFICATION="true"
LOG_LEVEL="info"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"
```

## Step 2: Database Creation

### Option A: Local PostgreSQL Setup

1. **Install PostgreSQL:**
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows - Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database:**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create user and database
   CREATE USER riscura_user WITH PASSWORD 'your_secure_password';
   CREATE DATABASE riscura_dev OWNER riscura_user;
   GRANT ALL PRIVILEGES ON DATABASE riscura_dev TO riscura_user;
   \q
   ```

3. **Update DATABASE_URL:**
   ```
   DATABASE_URL="postgresql://riscura_user:your_secure_password@localhost:5432/riscura_dev?schema=public"
   ```

### Option B: Docker Setup

1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       restart: always
       environment:
         POSTGRES_USER: riscura_user
         POSTGRES_PASSWORD: your_secure_password
         POSTGRES_DB: riscura_dev
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

### Option C: Cloud Database (Recommended for Production)

**Neon (Recommended):**
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string to your `.env.local`

**Other Options:**
- **Supabase:** https://supabase.com
- **PlanetScale:** https://planetscale.com (MySQL compatible)
- **Railway:** https://railway.app
- **Heroku Postgres:** https://www.heroku.com/postgres

## Step 3: Install Dependencies

If not already done, install the required packages:

```bash
npm install @prisma/client prisma bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
```

## Step 4: Database Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Push Schema to Database:**
   ```bash
   npx prisma db push
   ```

3. **Alternative: Create and Run Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

## Step 5: Seed Database

Run the database seeder to populate with sample data:

```bash
npm run db:seed
```

This will create:
- 2 Demo organizations
- 5 Demo users with different roles
- Sample risks, controls, documents
- Tasks, workflows, and questionnaires
- Complete activity logs and relationships

## Step 6: Verify Setup

1. **Check Database Connection:**
   ```bash
   npx prisma db pull
   ```

2. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   This opens a web interface at http://localhost:5555 to browse your data.

3. **Run Application:**
   ```bash
   npm run dev
   ```

## Available Database Commands

Add these scripts to your `package.json` if not already present:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

## Database Schema Overview

The database includes the following main entities:

### Core Entities
- **Organizations**: Multi-tenant isolation
- **Users**: Authentication and role management
- **Risks**: Risk assessment and management
- **Controls**: Risk control measures
- **Documents**: File management with AI analysis
- **Tasks**: Work item tracking
- **Workflows**: Business process automation
- **Questionnaires**: Assessment forms

### Relationships
- Organization → Users (1:N)
- Organization → Risks (1:N) 
- Risk ↔ Controls (N:M via mapping table)
- Users → Tasks (1:N assignments)
- All entities → Comments (1:N)
- All entities → Activities (1:N audit trail)

### Key Features
- **Multi-tenancy**: All data isolated by organizationId
- **Audit Trail**: Complete activity logging
- **Soft Deletes**: Where applicable
- **Optimized Indexes**: For performance
- **Foreign Key Constraints**: Data integrity
- **JSON Fields**: Flexible metadata storage

## Demo Data

The seeded database includes:

### Demo Organizations
1. **Riscura Demo Corporation** (Enterprise)
   - Financial services industry
   - Full feature set enabled

2. **TechStartup Inc.** (Pro)
   - Technology industry  
   - Startup-focused scenarios

### Demo Users
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@riscura-demo.com | demo123 |
| Risk Manager | riskmanager@riscura-demo.com | demo123 |
| Auditor | auditor@riscura-demo.com | demo123 |
| User | user@riscura-demo.com | demo123 |
| Startup CEO | ceo@techstartup.com | demo123 |

### Sample Data
- **6 Risks** across all categories (Cyber, Financial, Compliance, etc.)
- **6 Controls** with different types (Preventive, Detective, Corrective)
- **Control-Risk Mappings** showing relationships
- **3 Documents** with AI analysis metadata
- **1 Active Questionnaire** with sample responses
- **3 Tasks** in different states
- **1 Multi-step Workflow**
- **Comments and Activities** for all entities

## Troubleshooting

### Common Issues

1. **Connection Refused:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Confirm port 5432 is open

2. **Authentication Failed:**
   - Verify username/password
   - Check user permissions
   - Ensure database exists

3. **Migration Errors:**
   - Drop and recreate database if in development
   - Check for schema conflicts
   - Verify Prisma schema syntax

4. **Prisma Generate Fails:**
   - Clear `node_modules/.prisma` folder
   - Run `npm install` again
   - Check for syntax errors in schema

### Reset Database

To completely reset and reseed:

```bash
npx prisma migrate reset --force
npm run db:seed
```

### Environment Issues

If you get environment validation errors:
1. Check all required variables are set
2. Verify minimum string lengths for secrets
3. Ensure valid URLs for API endpoints

## Production Considerations

For production deployment:

1. **Use Environment-Specific Databases:**
   - Staging: Separate database
   - Production: Cloud provider with backups

2. **Security:**
   - Strong passwords (32+ characters)
   - SSL/TLS connections
   - Network security groups
   - Regular security updates

3. **Performance:**
   - Connection pooling
   - Query optimization
   - Database monitoring
   - Regular maintenance

4. **Backup Strategy:**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication
   - Backup testing procedures

## Next Steps

After database setup:

1. **Phase 1.2**: Real Authentication & Authorization
2. **Phase 1.3**: API Layer Completion  
3. **Phase 1.4**: File Storage & Document Management

The database layer provides the foundation for all subsequent development phases.

## Support

For issues with database setup:
1. Check the troubleshooting section above
2. Review PostgreSQL and Prisma documentation
3. Verify environment configuration
4. Test with minimal reproduction case 