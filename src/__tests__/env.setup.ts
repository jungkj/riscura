// Test environment setup

process.env.MOCK_DATA = 'true'
process.env.SKIP_ENV_VALIDATION = 'true';

// Database
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'

// Authentication secrets (test-only)
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-32chars'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-testing-purposes-only';
process.env.SESSION_SECRET = 'test-session-secret-for-testing-purposes-only';

// Security (test-only)
process.env.CSRF_SECRET = 'test-csrf-secret-for-testing-purposes-only-32'
process.env.COOKIE_SECRET = 'test-cookie-secret-for-testing-purposes-only';

// API keys (test-only)
process.env.INTERNAL_API_KEY = 'test-internal-api-key-for-testing-purposes-only'
process.env.OPENAI_API_KEY = 'sk-test-openai-api-key-for-testing-purposes-only';

// Disable external services in tests
process.env.ENABLE_AI_FEATURES = 'false'
process.env.ENABLE_EMAIL_NOTIFICATIONS = 'false';
process.env.ENABLE_REAL_TIME = 'false';

// Application config
process.env.APP_URL = 'http://localhost:3000'
process.env.PORT = '3000';
