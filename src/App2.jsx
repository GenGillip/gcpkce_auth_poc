/**
 * @fileoverview Main application component for gcpkce_auth_poc.
 * Implements PKCE OAuth authentication flow with Genesys Cloud using
 * the purecloud-platform-client-v2 SDK.
 * @module App2
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import platformClient from "purecloud-platform-client-v2";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

/** @constant {string} REGION - Genesys Cloud region from environment */
const REGION = import.meta.env.VITE_GC_REGION;
/** @constant {string} CLIENT_ID - OAuth client ID from environment */
const CLIENT_ID = import.meta.env.VITE_GC_CLIENT_ID;
/** @constant {string} REDIRECT_URI - OAuth redirect URI from environment */
const REDIRECT_URI = import.meta.env.VITE_GC_REDIRECT_URI;

/**
 * Checks if the current URL contains PKCE auth callback parameters.
 * @returns {boolean} True if `code` or `error` query params are present.
 */
function hasAuthParams() {
    const qs = new URLSearchParams(window.location.search);
    return qs.has("code") || qs.has("error");
}

/**
 * Root application component handling PKCE authentication lifecycle.
 * Provides login, logout, and API call functionality against Genesys Cloud.
 * @returns {React.JSX.Element} The rendered application UI.
 */
export default function App() {
    const [status, setStatus] = useState("unauthenticated");
    const [me, setMe] = useState(null);
    const [error, setError] = useState(null);

    const didInit = useRef(false);
    const client = useMemo(() => platformClient.ApiClient.instance, []);

    useEffect(() => {
        if (didInit.current) return; // protects against React 18 StrictMode double-effects (dev)
        didInit.current = true;

        client.setEnvironment(REGION);

        // Optional: persist tokens/settings (dev-friendly)
        client.setPersistSettings(true, "gc_pkce_vite_demo");

        // Only attempt to complete login automatically if we were redirected back with ?code=...
        if (hasAuthParams()) {
            setStatus("authenticating");
            client
                .loginPKCEGrant(CLIENT_ID, REDIRECT_URI, { state: "vite-demo" })
                .then(() => {
                    setError(null);
                    setStatus("authenticated");
                    // Optional: clean up the URL so refresh doesn't re-run the code exchange
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch((e) => {
                    setError(e);
                    setStatus("unauthenticated");
                });
        }
    }, [client]);

    /**
     * Initiates the PKCE login flow. Attempts SDK-driven redirect first,
     * then falls back to a manually constructed authorize URL.
     * @async
     */
    const login = async () => {
        setError(null);

        console.log("[PKCE] login clicked");
        console.log("[PKCE] region:", REGION);
        console.log("[PKCE] clientId:", CLIENT_ID);
        console.log("[PKCE] redirectUri:", REDIRECT_URI);

        try {
            client.setEnvironment(REGION);
            client.setPersistSettings(true, "gc_pkce_vite_demo");

            // If SDK is going to redirect, it should do it during this call.
            const p = client.loginPKCEGrant(CLIENT_ID, REDIRECT_URI, { state: "vite-demo" });

            // Some SDK flows return a promise that never resolves because the page navigates away.
            // But if we DON'T navigate, we'll detect it quickly.
            const timeout = new Promise((_, rej) =>
                setTimeout(() => rej(new Error("No redirect happened within 1500ms")), 1500)
            );

            await Promise.race([p, timeout]);
            console.log("[PKCE] loginPKCEGrant returned without redirect (unexpected).");
        } catch (e) {
            console.error("[PKCE] login failed:", e);
            setError(e);

            // --- FALLBACK: Build the authorize URL ourselves and redirect ---
            // Genesys Cloud PKCE uses /oauth/authorize. :contentReference[oaicite:0]{index=0}
            const authorizeBase = `https://login.${REGION}/oauth/authorize`; // most orgs work with login.<region>

            const params = new URLSearchParams({
                response_type: "code",
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                state: "vite-demo",
            });

            const authUrl = `${authorizeBase}?${params.toString()}`;
            console.warn("[PKCE] falling back to manual redirect:", authUrl);

            window.location.assign(authUrl);
        }
    };

    /**
     * Logs the user out by revoking the token, clearing stored auth data,
     * and resetting component state.
     * @async
     */
    const logout = async () => {
        client.logout(REDIRECT_URI);
        client.setAccessToken(null);
        // localStorage.removeItem("gc_auth");
        localStorage.removeItem("gc_pkce_vite_demo_auth_data");
        sessionStorage.clear();
        setStatus("unauthenticated");
        setError(null);
        setMe(null);
    };

    /**
     * Fetches the authenticated user's profile via the Genesys Cloud Users API.
     * @async
     */
    const getMe = async () => {
        setError(null);
        try {
            const usersApi = new platformClient.UsersApi();
            const data = await usersApi.getUsersMe();
            setMe(data);
        } catch (e) {
            setError(e);
        }
    };

    return (
        <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 900 }}>
            <h1>Genesys Cloud PKCE (purecloud-platform-client-v2 v219) + Vite</h1>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button onClick={login} disabled={status === "redirecting" || status === "authenticating"}>
                    Login (PKCE)
                </button>
                <button onClick={logout}>Logout</button>
                <button onClick={getMe} disabled={status !== "authenticated"}>
                    Call API: /users/me
                </button>
            </div>

            <div style={{ marginTop: 12 }}>
                <strong>Status:</strong> {status}
            </div>

            {me && (
                <>
                    <h3>/users/me</h3>
                    <pre>{JSON.stringify(me, null, 2)}</pre>
                </>
            )}

            {error && (
                <>
                    <h3 style={{ color: "crimson" }}>Error</h3>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {String(error?.stack || error?.message || error)}
                    </pre>
                </>
            )}
        </div>
    );
}