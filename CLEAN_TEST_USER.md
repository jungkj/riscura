# Clean Test User Setup

This document describes how to create a completely new test user with no pre-built risks, controls, or other data for testing features from scratch.

## Test User Details

**Email:** `testuser@riscura.com`  
**Password:** `TestUser123!`  
**Organization:** `Test User Organization`  
**Domain:** `testuser.riscura.com`  
**Role:** `RISK_MANAGER`  

## Setup Instructions

### Option 1: Using the Seed Script (Requires Database Access)

```bash
node scripts/seed-clean-user.js
```

### Option 2: Manual Database Setup (When Database is Available)

```bash
npx tsx prisma/seed-clean-test-user.ts
```

### Option 3: Using Prisma Studio (GUI)

1. Start Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Create Organization:
   - Name: `Test User Organization`
   - Domain: `testuser.riscura.com`
   - Plan: `pro`
   - Active: `true`

3. Create User:
   - Email: `testuser@riscura.com`
   - Password: `TestUser123!` (hashed with bcrypt)
   - Name: `Test User`
   - Role: `RISK_MANAGER`
   - Active: `true`
   - Email Verified: `true`

## Features to Test

With this clean test user, you can test:

- ✅ **User Registration & Login Flow**
- ✅ **Dashboard (Empty State)**
- ✅ **Risk Creation & Management**
- ✅ **Control Creation & Management**
- ✅ **Document Upload & Management**
- ✅ **Report Generation**
- ✅ **AI-Powered Risk Analysis**
- ✅ **Compliance Frameworks**
- ✅ **User Profile Management**
- ✅ **Organization Settings**
- ✅ **Workflow Management**

## Clean State Benefits

- No pre-existing risks to confuse testing
- No pre-built controls that might interfere
- Clean dashboard showing proper empty states
- Fresh organization settings
- Uncluttered UI for feature testing
- Clear progression through onboarding flows

## Database Schema

The seed script creates:

1. **Organization Record**
   - Fresh organization with default settings
   - Pro plan enabled
   - No existing data

2. **User Record**
   - Single test user with manager permissions
   - Verified email status
   - Secure password hash
   - Linked to test organization

3. **No Additional Data**
   - No risks, controls, documents, or reports
   - Clean slate for comprehensive testing

## Usage Notes

- Use this account to test the complete user journey
- Perfect for demo scenarios and feature validation
- Can be safely deleted and recreated as needed
- Isolated from production data and other test users 