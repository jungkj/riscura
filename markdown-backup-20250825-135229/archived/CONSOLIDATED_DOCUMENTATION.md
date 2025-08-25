# Riscura RCSA Platform - Comprehensive Documentation

> **Single Source of Truth**  
> This document consolidates all project documentation into one comprehensive reference.

**Last Updated:** 2025-08-25
**Version:** 1.0.0

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Development Setup](#development-setup)
4. [API Documentation](#api-documentation)
5. [Authentication & Security](#authentication--security)
6. [Database & Data Management](#database--data-management)
7. [Deployment & Infrastructure](#deployment--infrastructure)
8. [Testing Strategy](#testing-strategy)
9. [Performance & Optimization](#performance--optimization)
10. [Feature Roadmap](#feature-roadmap)
11. [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

Riscura RCSA Platform - Risk, Control, and Self-Assessment management system.

## 🏗️ Architecture & Technology Stack

Technology stack information not available.

## ⚙️ Development Setup

### Quick Start

```bash
# Clone and setup
git clone [repository]
cd riscura
npm install
npm run dev:setup
```

### From Required Environment Variables for Vercel

```
DATABASE_URL="postgresql://postgres:Gynaha2pf!123@db.zggstcxinvxsfksssdyr.supabase.co:5432/postgres"
```

### From Supabase Setup Guide

```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
   ```

### From Production Environment Requirements

```env
# NextAuth Configuration
NEXTAUTH_URL=https://riscura.app
NEXTAUTH_SECRET=[generate-secure-secret]  # Use: openssl rand -base64 32

# JWT Configuration  
JWT_ACCESS_SECRET=[generate-secure-secret]  # Use: openssl rand -base64 32
```

### From Free Infrastructure Setup for Riscura

```bash
# Test connection and check usage
npx tsx src/scripts/test-db-connection.ts
```

### From OAuth Deployment Instructions

```bash
  git commit --allow-empty -m "Trigger deployment with updated env vars"
  git push
  ```



## 📡 API Documentation

API documentation being consolidated.

## 🔐 Authentication & Security

### Overview

The application supports multiple authentication methods:
- Email/Password authentication
- Google OAuth 2.0
- Session-based authentication


