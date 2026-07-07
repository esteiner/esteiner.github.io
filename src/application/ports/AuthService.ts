/**
 * A snapshot of the current Solid session, sufficient for the sync layer to
 * reach the Pod. `fetch` is the authenticated fetch injected into `SolidEngine`.
 */
export interface SolidSession {
    isLoggedIn: boolean;
    webId: string | null;
    fetch: typeof fetch;
}

/**
 * Application port: read-only access to the Solid session for the sync layer.
 * The concrete implementation lives in infrastructure (wraps the OIDC session).
 */
export interface AuthService {
    isLoggedIn(): boolean;

    getSession(): SolidSession;
}
