# gcpkce_auth_poc

React/Vite proof-of-concept demonstrating the PKCE (Proof Key for Code Exchange) OAuth authentication flow with the Genesys Cloud JavaScript SDK (`purecloud-platform-client-v2`).

## Prerequisites

- Node.js 18+
- A Genesys Cloud organization with an OAuth client configured for **Code Authorization (PKCE)**

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` (or create `.env`) in the project root with your Genesys Cloud settings:
```env
VITE_GC_REGION=usw2.pure.cloud
VITE_GC_CLIENT_ID=<your-oauth-client-id>
VITE_GC_REDIRECT_URI=http://localhost:3002
```

3. Configure your OAuth client in Genesys Cloud Admin:
   - Grant type: **Code Authorization (PKCE)**
   - Authorized redirect URI: `http://localhost:3002`

## Run

```bash
npm run dev
```

Open http://localhost:3002 in your browser.

## Usage

1. Click **Login (PKCE)** — you will be redirected to the Genesys Cloud login page.
2. After authenticating, you are redirected back to the app with an authorization code.
3. The app automatically exchanges the code for an access token.
4. Click **Call API: /users/me** to fetch and display your Genesys Cloud user profile.
5. Click **Logout** to revoke the token and clear session data.

## Project Structure

```
gcpkce_auth_poc/
├── src/
│   ├── main.jsx        # App entry point — mounts React root
│   └── App2.jsx        # Main component — PKCE auth flow & UI
├── archive/
│   └── App.jsx         # Original simplified component (deprecated)
├── .env                # Environment variables (not committed)
├── index.html          # HTML shell
├── vite.config.js      # Vite config with Node polyfills
└── package.json
```

## Build

```bash
npm run build
npm run preview
```

## License

MIT
