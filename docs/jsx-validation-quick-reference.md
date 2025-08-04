# JSX Validation Quick Reference

## 🚀 Quick Commands

```bash
# Validate all JSX files
npm run jsx:validate

# Watch files for changes
npm run jsx:watch

# Fix issues automatically
npm run jsx:validate:fix

# Detailed validation report
npm run jsx:validate:verbose

# Run JSX tests
npm test jsx-validation.test.tsx
```

## 🔧 Common Fixes

### HTML → JSX Attributes
```jsx
class="..." → className="..."
for="..." → htmlFor="..."
```

### Self-Closing Tags
```jsx
<img src="..."></img> → <img src="..." />
<input type="text"></input> → <input type="text" />
```

### Missing Keys
```jsx
{items.map(item => <div>{item}</div>)}
↓
{items.map((item, index) => <div key={index}>{item}</div>)}
```

### Fragment Syntax
```jsx
return (
  <div>wrapper</div>
  <div>content</div>
); // ❌ Error

return (
  <>
    <div>content</div>
    <div>more content</div>
  </>
); // ✅ Correct
```

## 🚨 Emergency Bypass

```bash
# Create bypass file (use carefully!)
touch .jsx-validation-disabled

# Remove bypass
rm .jsx-validation-disabled
```

## 📊 Monitoring

```bash
# Check error trends
npm run jsx:report

# Initialize monitoring
npm run jsx:init

# Scan for new errors
npm run jsx:monitor
```

## ⚙️ Configuration Files

- `.eslintrc.json` - ESLint rules
- `.husky/pre-commit` - Git hooks
- `.jsx-metrics/` - Monitoring data
- `scripts/jsx-comprehensive-validator.js` - Main validator

## 🎯 Validation Levels

- **Quick**: Syntax only (`--level quick`)
- **Standard**: Syntax + ESLint (default)
- **Comprehensive**: Full suite (`--level comprehensive`)

## 🔍 Debug Mode

```bash
# Verbose output
npm run jsx:validate:verbose

# Watch with debug
npm run jsx:watch -- --verbose

# ESLint debug
DEBUG=eslint:* npm run lint
```