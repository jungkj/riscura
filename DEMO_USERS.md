# Riscura Demo Users & Testing Guide

This document provides comprehensive information about the demo users and testing functionality available in Riscura.

## 🎯 Demo Users Overview

The application includes three pre-configured test users with different roles and permissions to demonstrate the full range of features:

### 1. Administrator User
- **Email:** `admin@riscura.demo`
- **Password:** `demo123`
- **Role:** ADMIN
- **Permissions:** Full access to all features (*)
- **Profile:** Alex Administrator, Chief Risk Officer

**Features Available:**
- ✅ Full dashboard access
- ✅ Create, read, update, delete all risks
- ✅ Create, read, update, delete all controls
- ✅ Create, read, update, delete all documents
- ✅ Advanced reporting and analytics
- ✅ AI insights and analysis
- ✅ User management
- ✅ Organization settings
- ✅ API access
- ✅ Real-time collaboration

### 2. Manager User
- **Email:** `manager@riscura.demo`
- **Password:** `demo123`
- **Role:** MANAGER
- **Permissions:** Management-level access
- **Profile:** Maria Manager, Risk Manager

**Features Available:**
- ✅ Dashboard access
- ✅ Create, read, update, delete risks
- ✅ Read and update controls
- ✅ Read and create documents
- ✅ Standard reporting
- ✅ AI insights (read/write)
- ❌ User management
- ❌ Organization settings
- ❌ API access

### 3. Analyst User
- **Email:** `analyst@riscura.demo`
- **Password:** `demo123`
- **Role:** USER
- **Permissions:** Read-mostly access with limited write permissions
- **Profile:** John Analyst, Risk Analyst

**Features Available:**
- ✅ Dashboard access (read-only)
- ✅ Read and create risks
- ✅ Read controls
- ✅ Read documents
- ✅ Basic reporting
- ✅ AI insights (read-only)
- ❌ Delete operations
- ❌ User management
- ❌ Organization settings
- ❌ API access

## 📊 Demo Data Overview

Each demo user has access to realistic sample data:

### Risk Data (3 sample risks)
1. **Cybersecurity Threat** (High severity)
   - Category: Operational
   - Status: Open
   - Risk Score: 85

2. **GDPR Compliance Gap** (Critical severity)
   - Category: Compliance
   - Status: In Progress
   - Risk Score: 95

3. **Financial Fraud Risk** (Medium severity)
   - Category: Financial
   - Status: Mitigated
   - Risk Score: 65

### Control Data (2 sample controls)
1. **Access Control Management**
   - Type: Technical, Preventive
   - Status: Implemented
   - Effectiveness: High

2. **Data Encryption Standard**
   - Type: Technical, Preventive
   - Status: Planned
   - Effectiveness: Medium

### Document Data (2 sample documents)
1. **Enterprise Risk Management Policy**
   - Category: Policy
   - Status: Approved
   - Version: 2.1

2. **Cybersecurity Incident Response Procedures**
   - Category: Procedure
   - Status: Draft
   - Version: 1.0

### Dashboard Metrics
- **Risk Summary:** 25 total risks (3 critical, 8 high, 10 medium, 4 low)
- **Controls Summary:** 45 total controls (32 implemented, 8 planned, 5 testing)
- **Compliance Score:** 92% overall
- **Recent Activity:** Real-time activity feed with user actions

## 🚀 Quick Start Testing Guide

### 1. Login and Explore
```bash
# Start the development server
npm run dev

# Navigate to http://localhost:3001
# Use any of the demo credentials above to login
```

### 2. Test Different User Roles
1. **Login as Admin** (`admin@riscura.demo`) to see full functionality
2. **Login as Manager** (`manager@riscura.demo`) to see limited management features
3. **Login as Analyst** (`analyst@riscura.demo`) to see read-only analyst view

### 3. Feature Testing Checklist

#### Dashboard Testing
- [ ] View risk summary cards
- [ ] Check compliance score widget
- [ ] Review recent activity feed
- [ ] Test metric filters and date ranges

#### Risk Management Testing
- [ ] View risks list with different filters
- [ ] Create new risk (Admin/Manager only)
- [ ] Edit existing risk
- [ ] Test risk assessment calculations
- [ ] Try AI risk analysis

#### Control Management Testing
- [ ] Browse controls library
- [ ] Create new control (Admin/Manager only)
- [ ] Link controls to risks
- [ ] Test control effectiveness tracking

#### Document Management Testing
- [ ] Upload new documents (Admin/Manager only)
- [ ] View document library
- [ ] Test document search and filters
- [ ] Try document AI analysis

#### Reporting Testing
- [ ] Generate risk reports
- [ ] Export data to PDF/Excel
- [ ] Test custom report builders
- [ ] Verify role-based report access

#### AI Features Testing
- [ ] Run AI risk analysis
- [ ] Test document AI processing
- [ ] Try AI-powered insights
- [ ] Verify AI suggestions

## 🔧 API Testing

### Demo Data API Endpoints

#### Get All Demo Data
```bash
GET /api/demo/data
```

#### Get Specific Data Type
```bash
GET /api/demo/data?type=risks
GET /api/demo/data?type=controls
GET /api/demo/data?type=documents
GET /api/demo/data?type=metrics
GET /api/demo/data?type=users
```

#### Get User-Filtered Data
```bash
GET /api/demo/data?user=admin@riscura.demo
```

#### Simulate Operations
```bash
POST /api/demo/data
Content-Type: application/json

{
  "action": "create",
  "type": "risk",
  "data": {
    "title": "New Test Risk",
    "description": "Testing risk creation"
  },
  "userId": "admin@riscura.demo"
}
```

### Authentication API
```bash
# Test login
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@riscura.demo",
  "password": "demo123"
}

# Check available test users
GET /api/auth/login
```

## 🎨 UI/UX Testing Focus Areas

### 1. Responsive Design
- Test on desktop (1920x1080, 1366x768)
- Test on tablet (iPad, Android tablets)
- Test on mobile (iPhone, Android phones)

### 2. Navigation Testing
- Test sidebar navigation
- Verify breadcrumb functionality
- Check search functionality
- Test user profile dropdown

### 3. Form Testing
- Create/edit forms validation
- File upload functionality
- Date pickers and selectors
- Multi-select components

### 4. Data Visualization
- Dashboard charts and graphs
- Risk heat maps
- Compliance scorecards
- Trend analytics

## ⚡ Performance Testing

### Load Testing Scenarios
1. **Dashboard Load:** Login and measure dashboard render time
2. **Data Tables:** Load large lists with pagination/filtering
3. **File Uploads:** Test document upload with various file sizes
4. **AI Processing:** Test AI analysis response times

### Expected Performance Metrics
- **Dashboard Load:** < 2 seconds
- **API Responses:** < 500ms
- **File Uploads:** Progress indicators for >1MB files
- **AI Analysis:** 2-5 seconds with loading states

## 🔐 Security Testing

### Authentication Testing
- [ ] Test invalid credentials
- [ ] Verify rate limiting on login attempts
- [ ] Test session management
- [ ] Verify logout functionality

### Authorization Testing
- [ ] Test role-based access controls
- [ ] Verify permission restrictions
- [ ] Test API endpoint authorization
- [ ] Check data isolation between users

## 🐛 Bug Reporting

When testing, please report bugs with:

1. **User Role:** Which demo user was being used
2. **Steps to Reproduce:** Detailed steps
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happened
5. **Browser/Device:** Testing environment details
6. **Console Errors:** Any JavaScript console errors

## 📝 Test Scenarios

### Scenario 1: Risk Management Workflow
1. Login as Manager user
2. Create new operational risk
3. Add risk assessment details
4. Link to existing control
5. Generate risk report
6. Share with team member

### Scenario 2: Compliance Monitoring
1. Login as Admin user
2. View compliance dashboard
3. Review GDPR compliance gap
4. Create new control to address gap
5. Update risk status
6. Generate compliance report

### Scenario 3: Document Management
1. Login as Analyst user
2. Browse document library
3. View policy document
4. Try to edit (should be restricted)
5. Upload new document (should be restricted)
6. Generate document report

### Scenario 4: AI-Powered Analysis
1. Login as any user with AI access
2. Create new risk entry
3. Run AI risk analysis
4. Review AI recommendations
5. Apply AI suggestions
6. Export AI insights

## 🌟 Advanced Features to Test

### Real-time Collaboration
- Multiple user sessions
- Live updates across sessions
- Conflict resolution
- Activity notifications

### API Integration
- Test API endpoints with different user tokens
- Verify rate limiting
- Test webhook functionality
- API documentation accuracy

### Data Export/Import
- Export risks to Excel/PDF
- Import data from templates
- Backup/restore functionality
- Data migration tools

---

**Note:** This is a demo environment with simulated data. All demo users share the same organization and can see each other's data according to their permission levels. In production, users would be isolated to their respective organizations. 