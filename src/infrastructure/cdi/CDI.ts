import {SolidPodService} from "../solid/SolidPodService.ts";
import {InruptSolidService} from "../solid/InruptSolidService.ts";
import {SoukaiBottlesStorageRepository} from "../soukai/SoukaiBottlesStorageRepository.ts";
import type {SolidService} from "../../application/authentication/SolidService.ts";
import {KellermeisterService} from "../../application/KellermeisterService.ts";
import type {BottlesDocumentRepository} from "../../domain/Bottle/BottlesDocumentRepository.ts";
import {SoukaiCellarRepository} from "../soukai/SoukaiCellarRepository.ts";
import type {BottleFactory} from "../../domain/Bottle/BottleFactory.ts";
import {SoukaiBottleFactory} from "../soukai/model/SoukaiBottleFactory.ts";
import type {ProductFactory} from "../../domain/Product/ProductFactory.ts";
import {SoukaiProductFactory} from "../soukai/model/SoukaiProductFactory.ts";
import type {OrderFactory} from "../../domain/Order/OrderFactory.ts";
import {SoukaiOrderFactory} from "../soukai/model/SoukaiOrderFactory.ts";
import {SoukaiOrderRepository} from "../soukai/SoukaiOrderRepository.ts";

/**
 * Dependency Injection Container.
 *
 * Manages the creation and lifecycle of dependencies.
 * Alternative: https://lit.dev/docs/data/context/
 */
export class CDI {

    private static instance: CDI;

    // Storage URL
    private storageUrl: URL | null = null;

    // Factories
    private bottleFactory: BottleFactory;
    private productFactory: ProductFactory;
    private orderFactory: OrderFactory;

    // Repositories
    private bottleStorageRepository: BottlesDocumentRepository | null = null;
    private cellarRepository: SoukaiCellarRepository | null = null;
    private orderRepository: SoukaiOrderRepository | null = null;

    // Services
    private solidService: SolidService;
    private solidPodService: SolidPodService | null = null;
    private kellermeisterService: KellermeisterService | null = null;

    private constructor() {
        // Initialize factories
        this.bottleFactory = new SoukaiBottleFactory();
        this.productFactory = new SoukaiProductFactory();
        this.orderFactory = new SoukaiOrderFactory();
        // Initialize services
        this.solidService = new InruptSolidService();
    }

    public setStorageUrl(storageUrl: URL) {
        this.storageUrl = storageUrl;
        this.initializeComponents();
    }

    public static getInstance(): CDI {
        if (!CDI.instance) {
            CDI.instance = new CDI();
        }
        return CDI.instance;
    }

    public getSolidService(): SolidService {
        return this.solidService;
    }

    public getSolidPodService(): SolidPodService {
        if (this.solidPodService) {
            return this.solidPodService;
        }
        throw new Error("CDI has no storage URL set.");
    }

    public getKellermeisterService(): KellermeisterService {
        if (this.kellermeisterService) {
            return this.kellermeisterService;
        }
        throw new Error("CDI has no storage URL set.");
    }

    private initializeComponents() {
        if (this.storageUrl) {

            // Initialize repositories
            this.bottleStorageRepository = new SoukaiBottlesStorageRepository(this.storageUrl);
            this.cellarRepository = new SoukaiCellarRepository(this.storageUrl);
            this.orderRepository = new SoukaiOrderRepository(this.storageUrl);
            // Initialize services
            this.solidPodService = new SolidPodService(this.storageUrl);
            this.kellermeisterService = new KellermeisterService(this.cellarRepository, this.bottleStorageRepository, this.orderRepository, this.bottleFactory, this.orderFactory, this.productFactory);
        }
     }

}