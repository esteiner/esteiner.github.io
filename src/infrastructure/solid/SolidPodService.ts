import {SolidContainer} from "soukai-solid";

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
        const storageUrlString = this.storageUrl.toString();
        await this.setupContainer(new URL(storageUrlString + cellarsContainerPath), 'Cellars');
        await this.setupContainer(new URL(storageUrlString + ordersContainerPath), 'Orders');
        await this.setupContainer(new URL(storageUrlString + bottlesContainerPath), 'Bottles');
    }

    async setupContainer(containerUrl: URL, containerName: string) {
        console.log(`setupContainer: check for ${containerName} container at ${containerUrl}`);
        // 2. Container erstellen (falls noch nicht vorhanden)
        let container;
        try {
            container = await SolidContainer.find(containerUrl.toString());
            if (!container) {
                container = await SolidContainer.create({
                    url: containerUrl.toString(),
                    name: containerName
                });
                console.log(`setupContainer: ${containerName} container created at ${container.url}`);
            }
        }
        catch (error) {
            // Container nicht vorhanden, also erstellen
            console.log("setupContainer: error occurred:",error);
            console.log(`setupContainer: creating container ${containerName}`);
            container = await SolidContainer.create({
                url: containerUrl.toString(),
                name: containerName
            });
            console.log(`setupContainer: ${containerName} container created at ${container}`);
        }
        // // Typ im TypeIndex registrieren
        // await SolidTypeRegistration.forClass(
        //     'https://schema.org/Room',
        //     cellarsContainerUrl,
        //     { isListed: false }
        // );
        // console.log('Bottle type successfully registered');
    }
}
