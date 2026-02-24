import {KellermeisterService} from "../../application/KellermeisterService.ts";
import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import {SolidCellarRepository} from "../solid/SolidCellarRepository.ts";
import {SolidPodService} from "../solid/SolidPodService.ts";
import type {OrderRepository} from "../../domain/Order/OrderRepository.ts";
import {SolidOrderRespository} from "../solid/SolidOrderRespository.ts";
import type {BottlesContainerRepository} from "../../domain/Bottle/BottlesContainerRepository.ts";
import {SolidBottlesContainerRepository} from "../solid/SolidBottlesContainerRepository.ts";
import {BottleFactory} from "../../domain/Bottle/BottleFactory.ts";
import type {SolidService} from "../../application/authentication/SolidService.ts";
import {InruptSolidService} from "../solid/InruptSolidService.ts";

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
            this.kellermeisterService = new KellermeisterService(this.cellarRepository, this.bottlesContainerRepository, this.orderRepository, this.bottleFactory);
        }
     }

    public getBottleFactory(): BottleFactory {
        return this.bottleFactory;
    }

}