/**
 * API Documentation UI Endpoint
 * Serves interactive Swagger UI for API documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPI } from '@/lib/api/middleware';

// ============================================================================
// GET /api/docs/ui - Serve Swagger UI
// ============================================================================

async function handleGet(req: NextRequest) {
  const { origin } = new URL(req.url);
  const docsUrl = `${origin}/api/docs`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riscura API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.9.0/favicon-16x16.png" sizes="16x16" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    
    *, *:before, *:after {
      box-sizing: inherit;
    }
    
    body {
      margin: 0;
      background: #fafafa;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    
    .swagger-ui .topbar {
      background-color: #1f2937;
      border-bottom: 1px solid #374151;
    }
    
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .custom-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 600;
    }
    
    .custom-header p {
      margin: 0.5rem 0 0 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .api-info {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 0 2rem 2rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .api-info h2 {
      margin-top: 0;
      color: #1f2937;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .info-card {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    
    .info-card h3 {
      margin: 0 0 0.5rem 0;
      color: #374151;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .info-card p {
      margin: 0;
      color: #6b7280;
      font-size: 0.9rem;
    }
    
    .auth-info {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 1rem;
      margin: 1rem 0;
    }
    
    .auth-info h3 {
      margin: 0 0 0.5rem 0;
      color: #92400e;
    }
    
    .auth-info code {
      background: #fbbf24;
      color: #92400e;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>Riscura API Documentation</h1>
    <p>Comprehensive API reference for the Riscura risk management platform</p>
  </div>
  
  <div class="api-info">
    <h2>Getting Started</h2>
    
    <div class="auth-info">
      <h3>🔐 Authentication Required</h3>
      <p>Most API endpoints require authentication. Include your bearer token in the Authorization header:</p>
      <p><code>Authorization: Bearer YOUR_API_TOKEN</code></p>
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <h3>Base URL</h3>
        <p>Production: https://api.riscura.com</p>
        <p>Staging: https://staging-api.riscura.com</p>
        <p>Local: http://localhost:3000</p>
      </div>
      
      <div class="info-card">
        <h3>Rate Limits</h3>
        <p>Standard: 1000 requests/hour</p>
        <p>Premium: 5000 requests/hour</p>
        <p>Enterprise: Custom limits</p>
      </div>
      
      <div class="info-card">
        <h3>Response Format</h3>
        <p>All responses are in JSON format</p>
        <p>Standard success/error structure</p>
        <p>Includes metadata and pagination</p>
      </div>
      
      <div class="info-card">
        <h3>Support</h3>
        <p>Email: support@riscura.com</p>
        <p>Documentation: docs.riscura.com</p>
        <p>Status: status.riscura.com</p>
      </div>
    </div>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${docsUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          // Add organization header if available
          const orgId = localStorage.getItem('organizationId');
          if (orgId) {
            request.headers['Organization-ID'] = orgId;
          }
          return request;
        },
        responseInterceptor: function(response) {
          // Log API responses for debugging
          // console.log('API Response:', response);
          return response;
        },
        onComplete: function() {
          // console.log('Swagger UI loaded successfully');
        },
        onFailure: function(error) {
          // console.error('Swagger UI failed to load:', error);
        },
        docExpansion: 'list',
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        displayRequestDuration: true,
        requestSnippetsEnabled: true,
        requestSnippets: {
          generators: {
            "curl_bash": {
              title: "cURL (bash)",
              syntax: "bash"
            },
            "curl_powershell": {
              title: "cURL (PowerShell)",
              syntax: "powershell"
            },
            "curl_cmd": {
              title: "cURL (CMD)",
              syntax: "bash"
            }
          },
          defaultExpanded: false,
          languages: null
        },
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        validatorUrl: null,
        persistAuthorization: true,
        showMutatedRequest: true,
        defaultModelRendering: 'model',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1
      });
      
      // Add custom styling and functionality
      setTimeout(function() {
        // Hide the Swagger UI topbar URL input
        const topbar = document.querySelector('.swagger-ui .topbar');
        if (topbar) {
          const downloadWrapper = topbar.querySelector('.download-url-wrapper');
          if (downloadWrapper) {
            downloadWrapper.style.display = 'none';
          }
        }
        
        // Add organization ID input
        addOrganizationIdInput();
      }, 1000);
    };
    
    function addOrganizationIdInput() {
      const topbar = document.querySelector('.swagger-ui .topbar');
      if (topbar && !document.getElementById('org-id-input')) {
        const orgInput = document.createElement('div');
        orgInput.innerHTML = \`
          <div style="display: flex; align-items: center; gap: 1rem; margin-left: 2rem;">
            <label for="org-id-input" style="color: white; font-size: 0.9rem;">Organization ID:</label>
            <input 
              id="org-id-input" 
              type="text" 
              placeholder="Enter your org ID"
              style="padding: 0.5rem; border-radius: 4px; border: none; font-size: 0.9rem; width: 200px;"
              value="\${localStorage.getItem('organizationId') || ''}" />
            <button 
              onclick="setOrganizationId()"
              style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;"
            >
              Set
            </button>
          </div>
        \`;
        topbar.appendChild(orgInput);
      }
    }
    
    function setOrganizationId() {
      const input = document.getElementById('org-id-input');
      if (input) {
        const orgId = input.value.trim();
        if (orgId) {
          localStorage.setItem('organizationId', orgId);
          alert('Organization ID set! It will be included in API requests.');
        } else {
          localStorage.removeItem('organizationId');
          alert('Organization ID cleared.');
        }
      }
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export const GET = withAPI(handleGet, {
  requireAuth: false, // Public endpoint
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
});
