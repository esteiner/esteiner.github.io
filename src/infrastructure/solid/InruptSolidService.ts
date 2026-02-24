import { SOLID } from "@inrupt/vocab-solid";
import {getProfileAll, getThing, getUrlAll, type UrlString} from "@inrupt/solid-client";
import {
    fetch,
    getDefaultSession,
    handleIncomingRedirect,
    login,
    logout
} from "@inrupt/solid-client-authn-browser";
import type {SolidService} from "../../application/authentication/SolidService.ts";
import {WebIDProfile} from "../../domain/Solid/WebIDProfile.ts";

// https://docs.inrupt.com/guides/webid-document-best-practices
// https://docs.inrupt.com/guides/webid-document-best-practices/managing-webid-profiles#read-webid-profile-and-extended-profiles
export class InruptSolidService implements SolidService {
    async getWebIDProfile(webID: URL): Promise<WebIDProfile | null> {
        console.log("getWebIDProfile: for WebID:", webID);
        const webIDUrl: UrlString = webID.toString();
        try {
            const profiles = await getProfileAll(webIDUrl, { fetch });
            const webIdProfile = profiles.webIdProfile;
            const webIdThing = getThing(webIdProfile, webIDUrl);
            console.log("getWebIDProfile: webIdThing:", webIdThing);
            if (webIdThing) {
                const issuers = getUrlAll(webIdThing, SOLID.oidcIssuer);
                const storages = getUrlAll(webIdThing, 'http://www.w3.org/ns/pim/space#storage');
                const inboxes = getUrlAll(webIdThing, SOLID.inbox);
                console.log(`getWebIDProfile: found issers ${issuers} for WebID ${webID}.`);
                const webIDProfile: WebIDProfile = new WebIDProfile(issuers, storages, inboxes);
                return webIDProfile;
            }
            return null;
        } catch (e) {
            console.log("getWebIDProfile: failed with error:", e);
        }
        return null;
    }

    async login(oidcIssuer: URL): Promise<void> {
        console.log("login: with oidc issuer URL: ", oidcIssuer);
        // https://docs.inrupt.com/guides/authentication-in-solid/authentication-from-browser#start-login
        // check open: if working with: clientId: "https://kellermeister.ch/clientid.jsonld"
        login({
            oidcIssuer: oidcIssuer.toString(),
            redirectUrl: window.location.href,
            clientName: "Kellermeister",
        });
        console.log("login: session.info: ", getDefaultSession().info)
    }

    async restoreSession(): Promise<void> {
        console.log("restoreSession: ...");
        try {
            // https://docs.inrupt.com/guides/authentication-in-solid/authentication-from-browser#complete-login
            await handleIncomingRedirect({ restorePreviousSession: true });

            const session = getDefaultSession();

            if (session.info.isLoggedIn) {
                console.log("restoreSession: session.info: ", session.info);
            } else {
                console.log("restoreSession: not logged in");
            }
        }
        catch (error) {
            console.log("restoreSession: failed with error:", error);
        }
    }

    getAuthenticatedFetch(): any {
        return fetch;
    }

    async logout(): Promise<void> {
        console.log("logout");
        await logout();
    }
}