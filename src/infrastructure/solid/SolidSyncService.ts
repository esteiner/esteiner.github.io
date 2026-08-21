import {type Engine} from "soukai";
import {SolidEngine, type SolidModel} from "soukai-solid";
import type {AuthService, SolidSession} from "../../application/ports/AuthService.ts";
import type {SyncService, SyncOutcome} from "../../application/ports/SyncService.ts";
import type {Collection} from "../shared/resource-identity.ts";
import {LOCAL_BASE, rehomeUrl} from "../shared/resource-identity.ts";
import {withLocalEngine, withRemoteEngine} from "../soukai/engineScope.ts";
import {SoukaiCellar} from "../soukai/model/SoukaiCellar.ts";
import {SoukaiBottle} from "../soukai/model/SoukaiBottle.ts";
import {SoukaiProduct} from "../soukai/model/SoukaiProduct.ts";
import {SoukaiOrder} from "../soukai/model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "../soukai/model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "../soukai/model/SoukaiSeller.ts";
import {SoukaiCustomer} from "../soukai/model/SoukaiCustomer.ts";
import {SoukaiContactPoint} from "../soukai/model/SoukaiContactPoint.ts";

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
    /**
     * The resource embeds same-document relations that must travel with it
     * (orders embed their seller, customer, and order items). A `getAttributes()`
     * reconstruction drops those related models, so such resources are rebuilt
     * via `rebuildOrder` — loading the relations and re-creating them attached —
     * whenever they are re-homed or created on either side.
     */
    embedded?: boolean;
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
        {collection: "orders", model: SoukaiOrder as unknown as ModelClass, refFields: [], embedded: true},
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
     * Purely local work, so the whole migration runs in one gated scope.
     */
    private async rehome(spec: CollectionSpec, base: string): Promise<number> {
        return await withLocalEngine(() => this.rehomeLocally(spec, base));
    }

    private async rehomeLocally(spec: CollectionSpec, base: string): Promise<number> {
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
                if (spec.embedded) {
                    // Carry the embedded seller/customer/items into the new document.
                    await this.loadEmbedded(model);
                    await this.rebuildOrder(model, podUrl, base).save();
                } else {
                    const attributes: Record<string, unknown> = {...model.getAttributes(), url: podUrl};
                    for (const field of spec.refFields) {
                        const value = attributes[field];
                        if (typeof value === "string") {
                            attributes[field] = rehomeUrl(base, value);
                        }
                    }
                    await new spec.model(attributes).save();
                }
            }
            await model.forceDelete(); // remove the provisional record
            rehomed++;
        }
        return rehomed;
    }

    private async sweep(spec: CollectionSpec, base: string, solidEngine: Engine): Promise<number> {
        const container = `${base}${spec.collection}/`;
        // The embedded seller/customer/items must be loaded so they survive
        // synchronize()/create — each side under the engine that read it.
        const localModels = await withLocalEngine(async () => {
            const models = await spec.model.from(container).all();
            if (spec.embedded) {
                for (const m of models) {
                    await this.loadEmbedded(m);
                }
            }
            return models;
        });
        const remoteModels = await withRemoteEngine(solidEngine, async () => {
            const models = await spec.model.from(container).all();
            if (spec.embedded) {
                for (const m of models) {
                    await this.loadEmbedded(m);
                }
            }
            return models;
        });

        const localByUrl = new Map(localModels.map((m) => [m.url, m]));
        const remoteByUrl = new Map(remoteModels.map((m) => [m.url, m]));
        const urls = new Set<string>([...localByUrl.keys(), ...remoteByUrl.keys()]);

        let reconciled = 0;
        for (const url of urls) {
            const local = localByUrl.get(url);
            const remote = remoteByUrl.get(url);

            if (local && remote) {
                await withLocalEngine(async () => {
                    await spec.model.synchronize(local, remote);
                    await local.save();
                });
                await withRemoteEngine(solidEngine, () => remote.save());
                reconciled++;
            } else if (local && !remote && !local.isSoftDeleted()) {
                await withRemoteEngine(solidEngine, () => spec.embedded
                    ? this.rebuildOrder(local, local.url, base).save()
                    : new spec.model(local.getAttributes()).save());
                reconciled++;
            } else if (!local && remote && !remote.isSoftDeleted()) {
                await withLocalEngine(() => spec.embedded
                    ? this.rebuildOrder(remote, remote.url, base).save()
                    : new spec.model(remote.getAttributes()).save());
                reconciled++;
            }
        }
        return reconciled;
    }

    /** Load an order's same-document relations so they travel on re-home/create. */
    private async loadEmbedded(order: SolidModel): Promise<void> {
        const o = order as SoukaiOrder;
        await o.loadRelationIfUnloaded("seller");
        await o.loadRelationIfUnloaded("customer");
        // The customer's contactPoint is nested one level deeper (also same-document).
        await o.customer?.loadRelationIfUnloaded("contactPoint");
        await o.loadRelationIfUnloaded("positions");
    }

    /**
     * Rebuild an order as a fresh, unsaved model rooted at `targetUrl`, re-creating
     * its embedded seller, customer, and order items so a subsequent `save()`
     * writes them into the one document. Each item's cross-resource `productUrl`
     * is re-homed to `base` (the product is its own resource, swept separately and
     * re-homed first). Mirrors ingestion's factory build — the proven
     * same-document embedding path — which a `getAttributes()`-only reconstruction
     * cannot reproduce (it drops the related models entirely).
     */
    private rebuildOrder(source: SolidModel, targetUrl: string, base: string): SoukaiOrder {
        const src = source as SoukaiOrder;
        const order = new SoukaiOrder({
            orderNumber: src.orderNumber,
            orderDate: src.orderDate,
        });
        if (src.seller) {
            order.seller = new SoukaiSeller({name: src.seller.name, email: src.seller.email, homepage: src.seller.homepage});
        }
        if (src.customer) {
            const customer = new SoukaiCustomer({name: src.customer.name, email: src.customer.email, address: src.customer.address});
            if (src.customer.contactPoint) {
                // Rebuild the nested contactPoint so it re-homes within the document.
                customer.contactPoint = new SoukaiContactPoint({
                    name: src.customer.contactPoint.name,
                    email: src.customer.contactPoint.email,
                });
            }
            order.customer = customer;
        }
        for (const item of src.positions ?? []) {
            const rebuiltItem = new SoukaiOrderItem({
                orderQuantity: item.orderQuantity,
                price: item.price,
                priceCurrency: item.priceCurrency,
                productUrl: item.productUrl ? rehomeUrl(base, item.productUrl) : item.productUrl,
            });
            rebuiltItem.relatedOrder.addRelated(order);
            order.addOrderItem(rebuiltItem);
        }
        const documentUrl = targetUrl.split("#")[0];
        const resourceHash = targetUrl.split("#")[1] ?? "it";
        order.mintUrl(documentUrl, false, resourceHash);
        return order;
    }
}
