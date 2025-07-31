export default function TestGoogle() {

  return (
    <html>
      <head>
        <title>Google OAuth Test</title>
      </head>
      <body style={{ fontFamily: 'Arial', padding: '50px', textAlign: 'center' }}>
        <h1>Simple Google OAuth Test</h1>
        <p>This bypasses NextAuth completely</p>
        
        <div style={{ marginTop: '30px' }}>
          <a 
            href="/api/google-oauth/login" 
            style={{
              background: '#4285f4',
              color: 'white',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              display: 'inline-block'
            }}
          >
            Sign in with Google (Simple OAuth)
          </a>
        </div>
        
        <div style={{ marginTop: '50px', background: '#f0f0f0', padding: '20px', borderRadius: '5px' }}>
          <h3>How this works:</h3>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <li>Clicking the button goes to: /api/google-oauth/login</li>
            <li>That redirects to Google OAuth</li>
            <li>Google redirects back to: /api/google-oauth/callback</li>
            <li>Success redirects to: /dashboard</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <p>Current endpoints status:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>✅ /api/google-oauth/login - Ready</li>
            <li>✅ /api/google-oauth/callback - Ready</li>
            <li>✅ /api/google-oauth/session - Ready</li>
          </ul>
        </div>
      </body>
    </html>
  );
}