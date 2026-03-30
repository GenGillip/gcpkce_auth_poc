/**
 * @fileoverview Archived original App component for gcpkce_auth_poc.
 * Simple PKCE auth flow with hardcoded credentials (superseded by App2.jsx).
 * @module App
 * @deprecated Use App2.jsx with environment variables instead.
 */
import { useState, useEffect } from 'react';
import platformClient from 'purecloud-platform-client-v2';

const CLIENT_ID = 'UUID';
const REDIRECT_URI = 'http://localhost:3002';
const ENVIRONMENT = 'usw2.pure.cloud';

/**
 * Original application component with basic PKCE login/logout.
 * @returns {React.JSX.Element} The rendered application UI.
 * @deprecated Replaced by App2.jsx which uses environment-based configuration.
 */
function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const client = platformClient.ApiClient.instance;
    client.setEnvironment(ENVIRONMENT);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      client.loginPKCEGrant(CLIENT_ID, REDIRECT_URI)
        .then(() => {
          setAuthenticated(true);
          return new platformClient.UsersApi().getUsersMe();
        })
        .then(userMe => setUser(userMe))
        .catch(err => setError(err.message));
    }
  }, []);

  /**
   * Initiates PKCE login by generating a code verifier and calling loginPKCEGrant.
   * @async
   */
  const handleLogin = async () => {
    const client = platformClient.ApiClient.instance;
    client.setEnvironment(ENVIRONMENT);

    const state = Math.random().toString(36).substring(2);
    const codeVerifier = client.generatePKCECodeVerifier(128);

    sessionStorage.setItem('pkce_state', state);
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    await client.loginPKCEGrant(CLIENT_ID, REDIRECT_URI, { state }, codeVerifier)
      .catch(err => {
        console.error('Login error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        setError(err.message || 'Login failed');
      });
  };

  /**
   * Resets auth state and clears the URL query parameters.
   */
  const handleLogout = () => {
    setAuthenticated(false);
    setUser(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  if (error) {
    return <div style={{ padding: '20px' }}>Error: {error}</div>;
  }

  if (authenticated && user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Genesys Cloud PKCE Auth</h1>
        <p>Welcome, {user.name}!</p>
        <p>Email: {user.email}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Genesys Cloud PKCE Auth</h1>
      <button onClick={handleLogin}>Login with Genesys Cloud</button>
    </div>
  );
}

export default App;
