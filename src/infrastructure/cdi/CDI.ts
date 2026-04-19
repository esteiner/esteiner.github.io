import {SolidCellarRepository} from "../solid/SolidCellarRepository.ts";
import {SolidPodService} from "../solid/SolidPodService.ts";
import {SolidOrderRespository} from "../solid/SolidOrderRespository.ts";
import {InruptSolidService} from "../solid/InruptSolidService.ts";
import {SolidBottlesContainerRepository} from "../solid/SolidBottlesContainerRepository.ts";
import type {SolidService} from "../../application/authentication/SolidService.ts";
import {KellermeisterService} from "../../application/KellermeisterService.ts";
import {BottleFactory} from "../../domain/Bottle/BottleFactory.ts";
import type {BottlesContainerRepository} from "../../domain/Bottle/BottlesContainerRepository.ts";
import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import {OrderFactory} from "../../domain/Order/OrderFactory.ts";
import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import {ProductFactory} from "../../domain/Product/ProductFactory.ts";

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
    private cellarRepository: CellarRepository | null = null;
    private bottlesContainerRepository: BottlesContainerRepository | null = null;
    private orderRepository: OrderRepository | null = null;

    // Services
    private solidService: SolidService;
    private solidPodService: SolidPodService | null = null;
    private kellermeisterService: KellermeisterService | null = null;

    private constructor() {
        // Initialize factories
        this.bottleFactory = new BottleFactory();
        this.productFactory = new ProductFactory();
        this.orderFactory = new OrderFactory();
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
            this.cellarRepository = new SolidCellarRepository(this.storageUrl);
            this.bottlesContainerRepository = new SolidBottlesContainerRepository(this.storageUrl);
            this.orderRepository = new SolidOrderRespository(this.storageUrl);
            // Initialize services
            this.solidPodService = new SolidPodService(this.storageUrl);
            this.kellermeisterService = new KellermeisterService(this.cellarRepository, this.bottlesContainerRepository, this.orderRepository, this.bottleFactory, this.orderFactory, this.productFactory);
        }
     }

    public getBottleFactory(): BottleFactory {
        return this.bottleFactory;
    }

}