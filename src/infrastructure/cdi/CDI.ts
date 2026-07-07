import {InruptSolidService} from "../solid/InruptSolidService.ts";
import {InruptAuthService} from "../solid/InruptAuthService.ts";
import {PodContainerRegistry} from "../solid/PodContainerRegistry.ts";
import {SolidSyncService} from "../solid/SolidSyncService.ts";
import type {SolidService} from "../../application/authentication/SolidService.ts";
import type {AuthService} from "../../application/ports/AuthService.ts";
import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import {KellermeisterService} from "../../application/KellermeisterService.ts";
import {SynchronizeWithPod} from "../../application/sync/SynchronizeWithPod.ts";
import {SyncCoordinator} from "../../application/sync/SyncCoordinator.ts";
import {ReconnectSync} from "../../application/sync/ReconnectSync.ts";
import {SoukaiCellarRepository} from "../soukai/SoukaiCellarRepository.ts";
import {SoukaiBottleRepository} from "../soukai/SoukaiBottleRepository.ts";
import {SoukaiProductRepository} from "../soukai/SoukaiProductRepository.ts";
import {SoukaiOrderRepository} from "../soukai/SoukaiOrderRepository.ts";
import {SoukaiBottleFactory} from "../soukai/model/SoukaiBottleFactory.ts";
import {SoukaiProductFactory} from "../soukai/model/SoukaiProductFactory.ts";
import {SoukaiOrderFactory} from "../soukai/model/SoukaiOrderFactory.ts";

/**
 * Dependency Injection Container.
 *
 * Local-first: repositories are constructed eagerly at startup and are
 * local-only (IndexedDB) — no `storageUrl` is required to use the app. The Pod
 * container base is resolved lazily after login (via `setPodContainerBase`) and
 * the sync layer is the only path that reaches the Pod.
 */
export class CDI {

    private static instance: CDI;

    private readonly containers: PodContainerRegistry;

    private readonly solidService: SolidService;
    private readonly authService: AuthService;

    private readonly cellarRepository: CellarRepository;
    private readonly kellermeisterService: KellermeisterService;
    private readonly syncService: SolidSyncService;
    private readonly syncCoordinator: SyncCoordinator;
    private readonly reconnectSync: ReconnectSync;

    private constructor() {
        this.containers = new PodContainerRegistry();
        const podBase = () => this.containers.get();

        // Auth
        this.solidService = new InruptSolidService();
        this.authService = new InruptAuthService();

        // Repositories (local-only)
        const productRepository = new SoukaiProductRepository(podBase);
        const bottleRepository = new SoukaiBottleRepository(podBase, productRepository);
        const cellarRepository = new SoukaiCellarRepository(podBase);
        this.cellarRepository = cellarRepository;
        const orderRepository = new SoukaiOrderRepository(podBase);

        // Application service
        this.kellermeisterService = new KellermeisterService(
            cellarRepository, bottleRepository, productRepository, orderRepository,
            new SoukaiBottleFactory(), new SoukaiOrderFactory(), new SoukaiProductFactory(),
        );

        // Sync layer
        this.syncService = new SolidSyncService(this.authService, podBase);
        this.syncCoordinator = new SyncCoordinator(this.authService, new SynchronizeWithPod(this.authService, this.syncService));
        this.reconnectSync = new ReconnectSync(this.syncCoordinator, {maxRetries: 4, baseDelayMs: 2000});
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

    public getAuthService(): AuthService {
        return this.authService;
    }

    public getKellermeisterService(): KellermeisterService {
        return this.kellermeisterService;
    }

    public getCellarRepository(): CellarRepository {
        return this.cellarRepository;
    }

    public getSyncCoordinator(): SyncCoordinator {
        return this.syncCoordinator;
    }

    public getReconnectSync(): ReconnectSync {
        return this.reconnectSync;
    }

    public getPodContainerRegistry(): PodContainerRegistry {
        return this.containers;
    }

    public setPodContainerBase(base: string): void {
        this.containers.set(base);
    }
}
