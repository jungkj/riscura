# RISCURA - Enterprise Risk Management Platform

## Overview

RISCURA is a comprehensive enterprise risk management platform with integrated AI capabilities through ARIA (AI Risk Intelligence Assistant). Built with React 18, TypeScript, and modern UI components.

## Features

### Core Risk Management
- Risk identification, assessment, and monitoring
- Control library and effectiveness tracking  
- Document analysis and insights
- Compliance management
- Workflow automation
- Advanced reporting and analytics

### AI-Powered Features (ARIA)
- **Risk Analysis**: AI-powered risk assessment with quantitative scoring
- **Control Recommendations**: Intelligent control design and optimization
- **Compliance Guidance**: Regulatory requirement mapping and gap analysis
- **Document Analysis**: Automated risk identification from documents
- **Real-time Chat Interface**: Interactive AI assistant with specialized agents
- **Proactive Suggestions**: Context-aware recommendations and alerts

## ARIA AI Assistant

### Specialized Agents
- **Risk Analyzer**: Expert in risk assessment and quantification
- **Control Advisor**: Specialized in control design and testing
- **Compliance Expert**: Regulatory compliance and framework guidance
- **General Assistant**: Comprehensive risk management support

### Chat Interface Features
- Real-time message streaming with typing indicators
- Rich message formatting (markdown support)
- Voice input/output capabilities (Web Speech API)
- File drag-and-drop for document analysis
- Conversation search and filtering
- Export conversations (JSON, PDF, Markdown)
- Mobile-optimized bottom sheet interface
- Keyboard shortcuts (Ctrl+K to open)
- Contextual awareness of current page/section

### Integration Points
- Floating chat widget available on all pages
- Context preservation across navigation
- Deep linking with risk/control parameters
- Integration with existing notification system
- Seamless theme and authentication integration

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context + useReducer
- **Routing**: React Router v6
- **AI Integration**: OpenAI Agents SDK (ready for integration)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

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

# Set up environment variables
cp .env.example .env
# Configure VITE_OPENAI_API_KEY and other variables

# Start development server
npm run dev
```

### Environment Variables
```bash
# AI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_AI_AGENT_ENDPOINT=https://api.openai.com/v1/agents

# Application Settings
VITE_APP_NAME="RISCURA"
VITE_APP_VERSION="1.0.0"
```

## Usage

### Accessing ARIA
1. **Direct Access**: Navigate to `/aria` for the full ARIA interface
2. **Floating Widget**: Use Ctrl+K on any page to open the chat widget
3. **Context Integration**: Visit `/aria?risk=123` to start with specific risk context
4. **Mobile**: Swipe up from bottom to access ARIA on mobile devices

### AI Features in Action
```typescript
// Example: Starting a risk analysis conversation
const riskContext = {
  currentRisk: selectedRisk,
  relatedEntities: {
    risks: [riskId],
    controls: [],
    documents: []
  },
  pageContext: {
    section: 'risk_analysis',
    data: { riskId }
  }
};

// ARIA will automatically provide context-aware assistance
```

### Chat Templates
- **Risk Assessment**: "I need help analyzing a risk. Can you guide me through the assessment process?"
- **Control Design**: "I need to design controls for a specific risk. What approach should I take?"
- **Compliance Review**: "I need help reviewing our compliance status. Can you help identify requirements and gaps?"
- **General Consultation**: "Hello ARIA! I have some questions about risk management. Can you help?"

## Architecture

### AI Service Layer
```
src/
├── config/
│   └── ai.config.ts          # AI configuration and agent definitions
├── services/
│   └── AIService.ts          # Core AI service with enterprise features
├── context/
│   └── AIContext.tsx         # React context for AI state management
├── hooks/
│   └── useARIAChat.ts        # Chat state management hook
├── components/ai/
│   ├── ARIAChat.tsx          # Main chat interface
│   ├── ARIAWidget.tsx        # Floating chat widget
│   └── ChatMessage.tsx       # Message component with rich features
└── pages/ai/
    └── ARIAPage.tsx          # Dedicated ARIA page
```

### Key Components

#### AIService Features
- **Rate Limiting**: 50 requests/minute, 100k tokens/hour
- **Intelligent Caching**: 15-minute TTL with LRU eviction
- **Circuit Breaker**: Automatic fallback on service failures
- **Security**: Request sanitization, audit logging, input validation
- **Performance**: Background processing, streaming responses
- **Monitoring**: Token usage tracking, performance metrics

#### Enterprise Security
- Comprehensive audit logging for all AI interactions
- Rate limiting with user-specific quotas
- Input sanitization and validation
- Error handling with graceful degradation
- Secure context management

## Deployment

### Build for Production
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## API Integration

### OpenAI Agents SDK
The application is ready for OpenAI Agents SDK integration:

```typescript
// Example agent initialization
const agent = await openai.agents.create({
  name: "ARIA Risk Analyzer",
  instructions: aiConfig.agents.riskAnalyzer.systemPrompt,
  model: "gpt-4-turbo-preview",
  tools: [
    { type: "function", name: "risk_calculator" },
    { type: "function", name: "framework_lookup" }
  ]
});
```

## Development

### Project Structure
- `/src/components` - Reusable UI components
- `/src/pages` - Page-level components
- `/src/context` - Global state management
- `/src/hooks` - Custom React hooks
- `/src/services` - External service integrations
- `/src/types` - TypeScript type definitions
- `/src/lib` - Utility functions and helpers

### Contributing
1. Create feature branch
2. Follow TypeScript strict mode
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

## License

Enterprise License - All rights reserved.

## Support

For technical support or feature requests, contact the development team.

---

*ARIA - Your AI Risk Intelligence Assistant is ready to help optimize your risk management processes.* 

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd riscura
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure OpenAI Integration:**
   Create a `.env.local` file in the root directory with your OpenAI configuration:
   ```env
   # OpenAI Configuration (Required for AI features)
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional OpenAI Configuration
   VITE_OPENAI_ORGANIZATION=your_openai_organization_id
   VITE_OPENAI_BASE_URL=https://api.openai.com/v1
   
   # AI Service Configuration
   VITE_AI_DEFAULT_MODEL=gpt-4o-mini
   VITE_AI_MAX_TOKENS=4000
   VITE_AI_TEMPERATURE=0.7
   VITE_AI_RATE_LIMIT_RPM=50
   VITE_AI_RATE_LIMIT_TPM=100000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser and navigate to** `http://localhost:5173`

## 🔑 OpenAI API Setup

To use the AI-powered features in RISCURA, you need an OpenAI API key:

1. **Get an OpenAI API key:**
   - Visit [OpenAI's API platform](https://platform.openai.com/api-keys)
   - Sign up or log in to your account
   - Generate a new API key

2. **Add the API key to your environment:**
   - Copy the `.env.example` file to `.env.local`
   - Replace `your_openai_api_key_here` with your actual API key
   - Never commit your `.env.local` file to version control

3. **Configure model preferences:**
   - `gpt-4o-mini`: Recommended for development (cost-effective)
   - `gpt-4o`: For production use (higher quality responses)
   - `gpt-4-turbo`: Alternative high-quality option

## 🤖 AI Features

RISCURA includes comprehensive AI-powered features with specialized agents:

### **ARIA AI Assistant - Specialized Agents**

#### **🧠 Risk Analyzer Agent**
- **Expertise**: Comprehensive risk identification, assessment, and quantification
- **Methodologies**: COSO, ISO 31000, NIST RMF, Monte Carlo simulation, VaR modeling
- **Key Features**:
  - Quantitative and qualitative risk assessment
  - Risk interdependency and correlation analysis
  - Scenario modeling and stress testing
  - Key Risk Indicator (KRI) development
  - Risk appetite and tolerance recommendations
- **Prompt Templates**: Comprehensive assessment, quick assessment, scenario analysis

#### **🛡️ Control Advisor Agent**
- **Expertise**: Control framework design, implementation, and optimization
- **Frameworks**: COSO Internal Control, COBIT, SOX Section 404, ISO 27001
- **Key Features**:
  - Preventive, detective, and corrective control design
  - Control effectiveness assessment and testing methodologies
  - Implementation planning with cost-benefit analysis
  - Automated control recommendations
  - Control optimization and rationalization
- **Prompt Templates**: Control design, effectiveness assessment, environment optimization

#### **📋 Compliance Expert Agent**
- **Expertise**: Multi-jurisdictional regulatory compliance and audit preparation
- **Regulations**: SOX, GDPR, HIPAA, Basel III, MiFID II, CCPA, ISO standards
- **Key Features**:
  - Compliance gap analysis and remediation roadmaps
  - Regulatory interpretation and implementation guidance
  - Audit preparation and management
  - Policy and procedure development
  - Cross-jurisdictional compliance guidance
- **Prompt Templates**: Compliance assessment, regulatory interpretation, audit preparation

#### **🤖 General Assistant (ARIA)**
- **Expertise**: Enterprise risk management strategy and governance
- **Domains**: Strategic risk, operational risk, crisis management, ESG risk
- **Key Features**:
  - Enterprise risk strategy development
  - Business continuity and crisis management planning
  - Risk communication and reporting frameworks
  - Vendor and third-party risk management
  - Risk culture and awareness program development
- **Prompt Templates**: Enterprise strategy, crisis management, risk communication

### **Advanced AI Capabilities**

#### **Enterprise-Grade Features**
- **Real-time Streaming**: Live AI responses with typing indicators
- **Context Awareness**: Risk and control data injection into prompts
- **Confidence Scoring**: AI-calculated confidence levels for all recommendations
- **Prompt Templates**: Pre-built templates for common risk management tasks
- **Response Formatting**: Structured, enterprise-appropriate output formats
- **Fallback Responses**: Intelligent handling of edge cases and limitations

#### **Performance & Reliability**
- **Rate Limiting**: 50 requests/minute, 100k tokens/hour with automatic throttling
- **Circuit Breaker Pattern**: Automatic failure detection and recovery
- **Response Caching**: 15-minute TTL caching for improved performance
- **Usage Tracking**: Real-time token usage monitoring and cost calculation
- **Error Handling**: Comprehensive error recovery with retry mechanisms

#### **Agent Selection Interface**
- **Interactive Agent Cards**: Detailed agent capabilities and expertise areas
- **Template Explorer**: Browse available prompt templates for each agent
- **Usage Examples**: Real-world use cases for each agent specialization
- **Capability Matrix**: Clear overview of agent strengths and limitations

### **Risk Management Frameworks Integration**

The AI agents are trained on and reference industry-standard frameworks:

#### **Risk Assessment Frameworks**
- **COSO ERM**: Enterprise Risk Management Framework components and principles
- **ISO 31000**: Risk management guidelines and processes  
- **NIST RMF**: Risk Management Framework for information systems
- **Basel III**: Financial risk management for banking institutions

#### **Control Frameworks**
- **COSO Internal Control**: 17 principles across 5 components
- **COBIT**: IT governance and management framework
- **SOX Section 404**: Internal control over financial reporting
- **ISO 27001**: Information security management controls

#### **Compliance Standards**
- **Financial Services**: SOX, Basel III, MiFID II, Dodd-Frank, PCI DSS
- **Data Protection**: GDPR, CCPA, PIPEDA, SOC 2
- **Healthcare**: HIPAA, FDA regulations
- **Industry-Specific**: Varies by sector (energy, pharma, manufacturing)

### **AI Agent Usage Examples**

#### **Risk Analyzer Examples**
```
"Analyze our cybersecurity risk including likelihood assessment, impact analysis, 
and treatment recommendations using NIST framework."

"Conduct best/worst case scenario analysis for supply chain disruption risk 
with quantitative impact modeling."
```

#### **Control Advisor Examples**
```
"Design comprehensive controls for data privacy compliance including preventive, 
detective, and corrective measures with implementation timeline."

"Optimize our current control environment to reduce redundancy and improve 
automation opportunities."
```

#### **Compliance Expert Examples**
```
"Assess our current compliance state against GDPR requirements and provide 
detailed remediation roadmap with priorities."

"Help prepare for upcoming SOX audit including documentation requirements 
and testing procedures."
```

#### **General Assistant Examples**
```
"Develop comprehensive enterprise risk management strategy aligned with 
business objectives and stakeholder requirements."

"Create crisis management plan for business continuity during operational 
disruptions with stakeholder communication protocols."
```

## 📊 Current Features

### ✅ **Implemented Core Features** 