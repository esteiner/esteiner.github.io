import {fetch, getDefaultSession} from "@inrupt/solid-client-authn-browser";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";

/**
 * Adapts the Inrupt browser session to the application's AuthService port,
 * exposing the current session and the authenticated fetch for the sync layer.
 */
export class InruptAuthService implements AuthService {

    isLoggedIn(): boolean {
        return getDefaultSession().info.isLoggedIn;
    }

    getSession(): SolidSession {
        const info = getDefaultSession().info;
        return {
            isLoggedIn: info.isLoggedIn,
            webId: info.webId ?? null,
            fetch,
        };
    }
}
