import type {WebIDProfile} from "../../domain/Solid/WebIDProfile.ts";

export interface SolidService {

    getWebIDProfile(webID: URL): Promise<WebIDProfile | null>;

    login(oidcIssuer: URL): Promise<void>;

    restoreSession(): Promise<void>;

    logout(): Promise<void>;

    getAuthenticatedFetch(): any;

}