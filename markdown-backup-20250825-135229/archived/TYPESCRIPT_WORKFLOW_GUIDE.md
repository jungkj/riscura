# TypeScript Error Prevention Workflow

## 🎯 **Overview**

This guide ensures **zero TypeScript errors** reach production by setting up a comprehensive type-checking workflow.

## 🛠️ **Available Commands**

### 1. **Quick Type Check**
```bash
npm run type-check
```
- Fast TypeScript compilation check
- Uses `tsc --noEmit` 
- **Use this**: During development for quick feedback

### 2. **Full Type Check Suite** ⭐ **RECOMMENDED**
```bash
npm run type-check:full
```
- Comprehensive TypeScript + Next.js + ESLint checks
- **Use this**: Before committing to GitHub
- **Use this**: Before deploying to Vercel
- Catches ALL possible type errors

### 3. **Watch Mode** (Development)
```bash
npm run type-check:watch
```
- Continuous type checking during development
- **Use this**: In a separate terminal while coding

### 4. **Pre-commit Hook** (Automatic)
```bash
npm run precommit
```
- Runs automatically before every commit
- Prevents commits with type errors
- **Triggered**: Automatically by Git

## 🚀 **Recommended Workflow**

### **During Development**
1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **In another terminal, start type watching:**
   ```bash
   npm run type-check:watch
   ```

3. **Fix any type errors immediately as they appear**

### **Before Committing**
1. **Run full type check:**
   ```bash
   npm run type-check:full
   ```

2. **If passes, commit your changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

### **Emergency: Skip Type Check** (NOT RECOMMENDED)
If you absolutely must commit with type errors:
```bash
git commit --no-verify -m "Emergency commit - type errors to fix"
```
⚠️ **Warning**: Vercel will still fail to build!

## 🔧 **Setting Up Git Hooks**

### **Option 1: Manual Setup**
```bash
# Make the script executable
chmod +x scripts/type-check.js

# Create pre-commit hook
echo '#!/bin/sh\nnpm run precommit' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### **Option 2: Using Husky** (Recommended)
```bash
# Install husky
npm install --save-dev husky

# Setup husky
npx husky init

# Add pre-commit hook
echo "npm run precommit" > .husky/pre-commit
```

## 📊 **Understanding Type Errors**

### **Common Patterns and Fixes**

#### 1. **Implicit Any Error**
```typescript
// ❌ Error: Parameter 'item' implicitly has an 'any' type
items.map(item => item.name)

// ✅ Fix: Add explicit type
items.map((item: { name: string }) => item.name)
```

#### 2. **Possibly Undefined Error**
```typescript
// ❌ Error: 'user' is possibly 'undefined'
const name = user.firstName

// ✅ Fix: Add null check
const name = user?.firstName || 'Unknown'
```

#### 3. **Prisma Query Type Errors**
```typescript
// ❌ Error: Type 'null' not assignable
where: { field: { not: null } }

// ✅ Fix: Use proper Prisma syntax
where: { NOT: { field: null } }  // For nullable fields
where: { field: { gt: 0 } }      // For non-nullable fields
```

## 🎯 **Why This Matters**

### **Benefits of Strict TypeScript**
- **Catches Runtime Errors**: Before they reach production
- **Better Code Quality**: More maintainable and reliable code
- **Enhanced Developer Experience**: Better autocompletion and refactoring
- **Deployment Success**: No more Vercel build failures

### **What We Fixed**
- ✅ Analytics route: `effectiveness: { not: null }` → `effectiveness: { gt: 0 }`
- ✅ Dashboard route: Proper null checking for organization variable
- ✅ Mobile demo: Added explicit types for callback parameters

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Cannot find module" errors**
```bash
# Regenerate Prisma client
npm run db:generate

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### **"Process terminated" errors**
```bash
# Kill any running processes
pkill -f "next-dev"
pkill -f "tsc"

# Restart development
npm run dev
```

#### **Git hook not working**
```bash
# Check hook exists and is executable
ls -la .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 📈 **Success Metrics**

Track your TypeScript health:
- **Zero build failures** on Vercel
- **Zero type errors** in production
- **Faster development** with better error catching
- **Improved code confidence** and maintainability

## 🆘 **Emergency Procedures**

### **If Build Fails on Vercel**
1. **Check build logs** for specific error
2. **Reproduce locally**: `npm run type-check:full`
3. **Fix the type error** 
4. **Test fix**: `npm run type-check:full`
5. **Commit and redeploy**

### **If Stuck with Complex Type Error**
1. **Temporarily disable strict mode** for that file:
   ```typescript
   // @ts-nocheck
   ```
2. **Create GitHub issue** with error details
3. **Fix properly** in next iteration
4. **Remove @ts-nocheck**

---

**Remember**: TypeScript strict mode is your friend! It catches bugs before your users do. 🐛→✅ 