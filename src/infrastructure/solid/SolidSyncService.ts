import {withEngine, type Engine} from "soukai";
import {SolidEngine, type SolidModel} from "soukai-solid";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";
import type {SyncService, SyncOutcome} from "../../application/ports/SyncService.ts";
import type {Collection} from "../shared/resource-identity.ts";
import {LOCAL_BASE, rehomeUrl} from "../shared/resource-identity.ts";
import {SoukaiCellar} from "../soukai/model/SoukaiCellar.ts";
import {SoukaiBottle} from "../soukai/model/SoukaiBottle.ts";
import {SoukaiProduct} from "../soukai/model/SoukaiProduct.ts";
import {SoukaiOrder} from "../soukai/model/SoukaiOrder.ts";

/** A SolidModel class with the static members the sweep relies on. */
type ModelClass = {
    new (attributes?: object): SolidModel;
    from(container: string): {all(): Promise<SolidModel[]>};
    find(url: string): Promise<SolidModel | null>;
    synchronize(a: SolidModel, b: SolidModel): Promise<void>;
};

interface CollectionSpec {
    collection: Collection;
    model: ModelClass;
    /** Cross-resource reference fields whose `local://` values must be re-homed. */
    refFields: string[];
}

/**
 * Reconciles local (IndexedDB) state with the Pod via soukai-solid. This is the
 * ONLY component that reaches the Pod for domain data.
 *
 * Per collection:
 *   1. Re-home — migrate provisional (`local://…`) resources to deterministic
 *      Pod URLs locally (idempotent), rewriting their cross-resource references.
 *   2. Sweep   — union of local + remote by URL:
 *      - both present → `synchronize()` (LWW + soft-delete propagation), persist both
 *      - local-only, live → CREATE on the Pod
 *      - remote-only, live → CREATE locally
 */
export class SolidSyncService implements SyncService {

    private readonly specs: CollectionSpec[] = [
        {collection: "cellars", model: SoukaiCellar as unknown as ModelClass, refFields: []},
        {collection: "products", model: SoukaiProduct as unknown as ModelClass, refFields: ["orderItemUrl"]},
        {collection: "bottles", model: SoukaiBottle as unknown as ModelClass, refFields: ["productUrl", "cellarUrl"]},
        {collection: "orders", model: SoukaiOrder as unknown as ModelClass, refFields: []},
    ];

    /**
     * @param remoteEngine builds the engine used for Pod reads/writes. Defaults
     *   to `SolidEngine` over the authenticated fetch; overridable in tests to
     *   simulate the remote with a local engine.
     */
    constructor(
        private readonly auth: AuthService,
        private readonly podBase: () => string | null,
        private readonly remoteEngine: (session: SolidSession) => Engine = (session) => new SolidEngine(session.fetch),
    ) {
    }

    async synchronize(): Promise<SyncOutcome> {
        const session = this.auth.getSession();
        if (!session.isLoggedIn || !session.webId) {
            throw new Error("Cannot synchronize without an authenticated session.");
        }
        const base = this.podBase();
        if (!base) {
            throw new Error("Cannot synchronize before the Pod container is resolved.");
        }
        const solidEngine = this.remoteEngine(session);

        let reconciled = 0;
        for (const spec of this.specs) {
            reconciled += await this.rehome(spec, base);
            reconciled += await this.sweep(spec, base, solidEngine);
        }
        return {reconciled};
    }

    /**
     * Migrate provisional resources of a collection to their deterministic Pod
     * URL locally (rewriting cross-references), then drop the provisional record.
     * Provisional resources deleted before ever syncing are purged. Idempotent.
     */
    private async rehome(spec: CollectionSpec, base: string): Promise<number> {
        const provisional = await spec.model.from(`${LOCAL_BASE}${spec.collection}/`).all();
        let rehomed = 0;
        for (const model of provisional) {
            if (model.isSoftDeleted()) {
                await model.forceDelete(); // never synced → just drop it locally
                continue;
            }
            const podUrl = rehomeUrl(base, model.url);
            const existing = await spec.model.find(podUrl);
            if (!existing) {
                const attributes: Record<string, unknown> = {...model.getAttributes(), url: podUrl};
                for (const field of spec.refFields) {
                    const value = attributes[field];
                    if (typeof value === "string") {
                        attributes[field] = rehomeUrl(base, value);
                    }
                }
                await new spec.model(attributes).save();
            }
            await model.forceDelete(); // remove the provisional record
            rehomed++;
        }
        return rehomed;
    }

    private async sweep(spec: CollectionSpec, base: string, solidEngine: Engine): Promise<number> {
        const container = `${base}${spec.collection}/`;
        const localModels = await spec.model.from(container).all();
        const remoteModels = await withEngine(solidEngine, () => spec.model.from(container).all());

        const localByUrl = new Map(localModels.map((m) => [m.url, m]));
        const remoteByUrl = new Map(remoteModels.map((m) => [m.url, m]));
        const urls = new Set<string>([...localByUrl.keys(), ...remoteByUrl.keys()]);

        let reconciled = 0;
        for (const url of urls) {
            const local = localByUrl.get(url);
            const remote = remoteByUrl.get(url);

            if (local && remote) {
                await spec.model.synchronize(local, remote);
                await local.save();
                await withEngine(solidEngine, () => remote.save());
                reconciled++;
            } else if (local && !remote && !local.isSoftDeleted()) {
                await withEngine(solidEngine, () => new spec.model(local.getAttributes()).save());
                reconciled++;
            } else if (!local && remote && !remote.isSoftDeleted()) {
                await new spec.model(remote.getAttributes()).save();
                reconciled++;
            }
        }
        return reconciled;
    }
}
