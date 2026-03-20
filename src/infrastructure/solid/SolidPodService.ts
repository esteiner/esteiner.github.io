import {getSolidDataset, createContainerAt, universalAccess, getResourceInfo} from "@inrupt/solid-client";
import {fetch} from "@inrupt/solid-client-authn-browser";
import {getAclServerResourceInfo} from "@inrupt/solid-client/universal";

const inboxContainerPath: string = 'inbox/';
const inboxKellermeisterContainerPath: string = 'inbox/kellermeister/';
const ordersContainerPath: string = 'private/kellermeister/orders/';
const cellarsContainerPath: string = 'private/kellermeister/cellars/';
const bottlesContainerPath: string = 'private/kellermeister/bottles/';

export class SolidPodService {

    private storageUrl: URL;

    constructor(storageUrl: URL) {
        this.storageUrl = storageUrl;
    }

    async setupPodForKellermeister(): Promise<void> {
        console.log("setupPodForKellermeister");
        await this.setupFolder(inboxContainerPath);
        await this.setupFolder(inboxKellermeisterContainerPath);
        await this.setInboxKellermeisterAppendable(); // ACR or ACL
        await this.setupFolder(cellarsContainerPath);
        await this.setupFolder(ordersContainerPath);
        await this.setupFolder(bottlesContainerPath);
    }

    async setupFolder(urlPath: String) {
        let url: URL = new URL(this.storageUrl.toString() + urlPath);
        // check if folder exists
        let folder = null;
        try {
            folder = await getSolidDataset(url.toString(), { fetch: fetch });
        }
        catch (e) {
            console.log("setupFolder: folder doesn't yet exist: ",urlPath);
        }
        // create folder
        try {
            if (!folder) {
                await createContainerAt(url.toString(), { fetch: fetch });
                console.log("setupFolder: folder created", url.toString());
            }
        }
        catch (e) {
            console.log("setupFolder: failed to create folder", url.toString(), e);
        }
    }

    async setInboxKellermeisterAppendable() {
        try {
            let url: URL = new URL(this.storageUrl.toString() + inboxKellermeisterContainerPath);
            console.log("setInboxKellermeisterAppendable: url", url.toString());
            const resourceInfo = await getResourceInfo(url.toString(), { fetch: fetch });
            console.log("setInboxKellermeisterAppendable: resourceInfo", resourceInfo);
            // WAC or ACP ???
            const aclServerResourceInfo = await getAclServerResourceInfo(resourceInfo, { fetch: fetch });
            console.log("setInboxKellermeisterAppendable: aclServerResourceInfo:", aclServerResourceInfo);
            const accessModes = await universalAccess.setPublicAccess(
                url.toString(),
                { append: true },   // grant append; leave read/write/control untouched
                { fetch: fetch }
            )
            console.log("setInboxKellermeisterAppendable: accessMode", accessModes);
        }
        catch (e) {
            console.log("setInboxKellermeisterAppendable: failed", e);
        }
    }

}
