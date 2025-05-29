# Riscura - AI-Powered RCSA Platform

## Phase 1: Foundation & Authentication - COMPLETED ✅

A modern, AI-powered Risk and Control Self-Assessment (RCSA) application built with React, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd riscura

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔐 Demo Credentials

The application includes multiple demo accounts with different roles:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Risk Manager** | demo@rcsa.com | demo123 | Read/Write Risks, Read/Write Controls |
| **Admin** | admin@rcsa.com | admin123 | All Permissions (*) |
| **Auditor** | auditor@rcsa.com | audit123 | Read Risks, Read Controls, Read Reports |

## 📋 Phase 1 Features Implemented

### ✅ Authentication System
- **Complete JWT-like token simulation** with expiration handling
- **Role-based access control** (Admin, Risk Manager, Auditor, User)
- **Permission-based routing** with granular access control
- **In-memory state management** (no localStorage/sessionStorage)
- **Enhanced error handling** with user-friendly messages
- **Loading states** for better UX

### ✅ State Management Architecture
- **useReducer pattern** for complex state management
- **Context providers** for modular state organization
- **Custom hooks** for business logic abstraction
- **Type-safe state interfaces** with TypeScript
- **Error boundaries** and proper error handling

### ✅ Core Data Models & Types
- **Comprehensive TypeScript interfaces** for all entities
- **Risk management types** (Risk, Control, RiskCategory, etc.)
- **User management types** with role-based permissions
- **Document and workflow types** for future phases
- **State management types** for consistent data flow

### ✅ Protected Routing System
- **ProtectedRoute component** with role and permission checking
- **Higher-order components** for route protection
- **Unauthorized page** for access denied scenarios
- **Redirect logic** with proper state preservation
- **Role-specific route components** for easy usage

### ✅ Foundation Components
- **Enhanced Button** with loading states and icons
- **Loading Spinner** components for various use cases
- **Form validation** with Zod schemas
- **Utility functions** for business logic
- **shadcn/ui integration** with custom enhancements

### ✅ Mock Data Generation
- **Realistic sample data** for development and testing
- **10+ sample risks** across all categories
- **8+ sample controls** with different types
- **Sample documents** with AI analysis simulation
- **User accounts** with different roles and permissions

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + custom enhancements
- **State Management**: React Context + useReducer
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Build Tool**: Vite

### Project Structure
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── ui/             # shadcn/ui components + enhancements
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state management
│   └── ThemeContext.tsx
├── lib/                # Utility functions and configurations
│   ├── utils.ts        # Helper functions
│   ├── validations.ts  # Zod schemas
│   └── mockData.ts     # Sample data generation
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   └── ...
├── types/              # TypeScript type definitions
│   └── index.ts        # All application types
└── ...
```

### State Management
The application uses a modular state management approach:

- **AuthContext**: User authentication and session management
- **Individual contexts** for each domain (Risks, Controls, etc.)
- **useReducer pattern** for complex state transitions
- **Custom hooks** for business logic abstraction

### Authentication Flow
1. User enters credentials on login page
2. AuthService validates credentials (mock implementation)
3. JWT-like token generated with expiration
4. User state and token stored in memory
5. Protected routes check authentication and permissions
6. Automatic logout on token expiration

## 🔒 Security Features

- **Role-based access control** with granular permissions
- **Route protection** at component level
- **Token expiration** handling
- **Permission checking** utilities
- **Secure state management** (in-memory only)

## 🎨 UI/UX Features

- **Responsive design** with mobile-first approach
- **Loading states** for all async operations
- **Error handling** with user-friendly messages
- **Consistent styling** with Tailwind CSS
- **Accessibility** with proper ARIA labels
- **Modern UI components** from shadcn/ui

## 🧪 Development Features

- **TypeScript** for type safety
- **ESLint** for code quality
- **Hot reload** with Vite
- **Mock data** for development
- **Comprehensive error handling**

## 📝 API Simulation

The application includes realistic API simulation:

- **Authentication endpoints** with proper delays
- **Error scenarios** (invalid credentials, email exists, etc.)
- **Token management** with expiration
- **Role-based responses** based on user permissions

## 🔄 Next Phase Preview

Phase 2 will implement:
- **Risk Management CRUD** operations
- **Interactive Risk Matrix** visualization
- **Document Upload** with AI analysis simulation
- **Control Library** management
- **Risk-Control Mapping** functionality

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## 📚 Key Files

### Authentication
- `src/context/AuthContext.tsx` - Authentication state management
- `src/components/auth/ProtectedRoute.tsx` - Route protection
- `src/pages/auth/LoginPage.tsx` - Login interface

### Types & Validation
- `src/types/index.ts` - All TypeScript interfaces
- `src/lib/validations.ts` - Zod validation schemas
- `src/lib/utils.ts` - Utility functions

### Mock Data
- `src/lib/mockData.ts` - Sample data generation

## 🎯 Testing the Implementation

1. **Start the application**: `npm run dev`
2. **Visit**: `http://localhost:5173`
3. **Try different roles**: Use the demo credentials provided
4. **Test permissions**: Navigate to different sections
5. **Test authentication**: Logout and login with different accounts

## 📋 Phase 1 Checklist

- ✅ Complete authentication system with JWT simulation
- ✅ Role-based access control with permissions
- ✅ Protected routing with unauthorized handling
- ✅ Global state management with useReducer
- ✅ Core data models and TypeScript interfaces
- ✅ Form validation with Zod schemas
- ✅ Foundation components and utilities
- ✅ Mock data generation for development
- ✅ Enhanced UI components with loading states
- ✅ Comprehensive error handling
- ✅ Responsive design with Tailwind CSS
- ✅ In-memory state management (no localStorage)

## 🚀 Ready for Phase 2

The foundation is now complete and ready for implementing the core Risk Management functionality in Phase 2. The authentication system, state management, and component architecture provide a solid base for building the RCSA features. 