/*
 * Class representing a WebID Profile Document according to https://solid.github.io/webid-profile/
 */
export class WebIDProfile {

    private oidcIssuers: URL[] = new Array();
    private storageUrls: URL[] = new Array();
    private inboxUrls: URL[] = new Array();

    constructor(oidcIssuerUrls: string[], storageUrls: string[], inboxUrls: string[]) {
        if (oidcIssuerUrls) {
            this.oidcIssuers = oidcIssuerUrls.map(url => new URL(url));
        }
        if (storageUrls) {
            this.storageUrls = storageUrls.map(url => new URL(url));
        }
        if (inboxUrls) {
            this.inboxUrls = inboxUrls.map(url => new URL(url));
        }
    }


    /**
     * Get oidcIssuer entries from WebID profile.
     */
    getIssuerUrls(): URL[] {
        return this.oidcIssuers;
    }

    getStorageUrls(): URL[] {
        return this.storageUrls;
    }

    getInboxUrl(): URL[] {
        return this.inboxUrls;
    }

}