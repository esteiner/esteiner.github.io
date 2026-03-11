import {isContainer, createContainerAt, universalAccess, getResourceInfo} from "@inrupt/solid-client";
import {fetch} from "@inrupt/solid-client-authn-browser";
import {getAclServerResourceInfo} from "@inrupt/solid-client/universal";

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
        await this.setupFolder(inboxKellermeisterContainerPath);
        await this.setInboxKellermeisterAppendable(); // ACR or ACL
        await this.setupFolder(cellarsContainerPath);
        await this.setupFolder(ordersContainerPath);
        await this.setupFolder(bottlesContainerPath);
    }

    async setupFolder(urlPath: String) {
        let url: URL = new URL(this.storageUrl.toString() + urlPath);
        try {
            if (!isContainer(url.toString())) {
                await createContainerAt(url.toString(), { fetch: fetch });
                console.log("setupFolder: path created", url.toString());
            } else {
                console.log("setupFolder: path exists", url.toString());
            }
        }
        catch (e) {
            console.log("setupFolder: failed to create path", url.toString(), e);
        }
    }

    async setInboxKellermeisterAppendable() {
        let url: URL = new URL(this.storageUrl.toString() + inboxKellermeisterContainerPath);
        const resourceInfo = await getResourceInfo(url.toString(), { fetch: fetch });
        console.log("setInboxKellermeisterAppendable:", resourceInfo);
        let aclServerResourceInfo = await getAclServerResourceInfo(resourceInfo, { fetch: fetch });
        console.log("setInboxKellermeisterAppendable: aclServerResourceInfo:", aclServerResourceInfo);
        let accessModes = await universalAccess.setPublicAccess(
            url.toString(),
            { append: true },   // grant append; leave read/write/control untouched
            { fetch: fetch }
        );
        console.log("setInboxKellermeisterAppendable:", accessModes);
    }

}
