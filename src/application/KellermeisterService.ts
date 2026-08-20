import {ProductFilter} from "../domain/Product/ProductFilter.ts";
import type {BottleRepository} from "../domain/Bottle/BottleRepository.ts";
import type {ProductRepository} from "../domain/Product/ProductRepository.ts";
import type {Bottle} from "../domain/Bottle/Bottle.ts";
import type {Product} from "../domain/Product/Product.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {Cellar} from "../domain/Cellar/Cellar.ts";
import type {BottleFactory} from "../domain/Bottle/BottleFactory.ts";
import type {ProductFactory} from "../domain/Product/ProductFactory.ts";
import type {OrderFactory} from "../domain/Order/OrderFactory.ts";
import type {Order} from "../domain/Order/Order.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";

/**
 * Application Use Case: Get Profile
 * Retrieves the Solid profile for a given WebID
 */
export class KellermeisterService {

    private cachedBottles: Bottle[] | null = null;
    private cachedCellars: Cellar[] | null = null;
    private cachedOrders: Order[] | null = null;

    constructor(private cellarRepository: CellarRepository, private bottleRepository: BottleRepository, private productRepository: ProductRepository, private orderRespository: OrderRepository, private bottleFactory: BottleFactory, private orderFactory: OrderFactory, private productFactory: ProductFactory) {
    }

    getAltglassId(): string {
        return this.cellarRepository.getAltglassId();
    }

    async getCellarAltglass(): Promise<Cellar | null> {
        return await this.getCellarById(this.getAltglassId())
    }

    getCellarWorkId(): string {
        return this.cellarRepository.getCellarWorkId();
    }

    async getCellarCellarWork(): Promise<Cellar | null> {
        return await this.getCellarById(this.getCellarWorkId());
    }

    async getAllBottles(): Promise<Bottle[]> {
        if (this.cachedBottles) {
            return this.cachedBottles;
        }
        this.cachedBottles = await this.bottleRepository.fetchBottles();
        return this.cachedBottles;
    }

    /**
     * Returns a map with the product.id as key and an array of bottles as value.
     */
    async searchBottlesGroupedByCellar(filter: ProductFilter): Promise<Map<Cellar, Map<string, Bottle[]>>> {
        const [bottles, cellars] = await Promise.all([this.getAllBottles(), this.getAllCellars()]);
        const cellarMap = new Map<string, Cellar>(cellars.map(c => [c.getId(), c]));
        const grouped = new Map<string, Map<string, Bottle[]>>();

        for (const bottle of bottles) {
            if (bottle.getProduct() && bottle.getCellar() && filter.filterProduct(bottle.getProduct())) {
                if (!grouped.has(bottle.getCellar())) {
                    grouped.set(bottle.getCellar(), new Map());
                }
                const byProduct = grouped.get(bottle.getCellar())!;
                if (!byProduct.has(bottle.getProduct().getId())) {
                    byProduct.set(bottle.getProduct().getId(), []);
                }
                byProduct.get(bottle.getProduct().getId())!.push(bottle);
            }
        }

        const result = new Map<Cellar, Map<string, Bottle[]>>();
        const toSortKey = (c: Cellar) => {
            const d = c.getDisplayOrder() ?? 0;
            return d < 0 ? Number.MAX_SAFE_INTEGER : d;
        };
        const sortedCellarIds = [...grouped.keys()].sort((a, b) => {
            const ca = cellarMap.get(a);
            const cb = cellarMap.get(b);
            if (!ca || !cb) return 0;
            const orderDiff = toSortKey(ca) - toSortKey(cb);
            if (orderDiff !== 0) return orderDiff;
            return (ca.getName() ?? '').localeCompare(cb.getName() ?? '');
        });
        for (const cellarId of sortedCellarIds) {
            const cellar = cellarMap.get(cellarId);
            if (cellar) {
                const byProduct = grouped.get(cellarId)!;
                const sortedByProduct = new Map(
                    [...byProduct.entries()].sort(([, a], [, b]) =>
                        (a[0].getProduct().getName() ?? '').toLowerCase()
                            .localeCompare((b[0].getProduct().getName() ?? '').toLowerCase())
                    )
                );
                result.set(cellar, sortedByProduct);
            }
        }
        return result;
    }

    async bottlesFromCellarGroupedByProduct(cellar: Cellar | undefined, filter: ProductFilter): Promise<Map<string, Bottle[]>> {
        const bottles = await this.getAllBottles();
        const grouped = new Map<string, Bottle[]>();

        for (const bottle of bottles) {
            if (bottle.getProduct() && this.isBottleInThisCellar(bottle, cellar) && filter.filterProduct(bottle.getProduct())) {
                //console.log("bottlesFromCellarGroupedByProduct", bottle.getProduct().getName());
                if (!grouped.has(bottle.getProduct().getName())) {
                    grouped.set(bottle.getProduct().getName(), []);
                }
                grouped.get(bottle.getProduct().getName())?.push(bottle);
            }
        }
        return new Map([...grouped.entries()].sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase())));
    }

    /**
     * Returns a map with the product.id as key and an array of bottles as value.
     */
    async bottlesFromCellar(cellar: Cellar | undefined, filter: ProductFilter): Promise<Bottle[]> {
        const bottles = await this.getAllBottles();
        return bottles.filter(bottle => cellar?.getId() === bottle.getCellar()).filter(bottle => filter.filterProduct(bottle.getProduct()))
            .sort((a: Bottle, b: Bottle) => this.productComparator(a.getProduct(), b.getProduct()));
    }

    productComparator(a: Product, b: Product): number {
        const nameA = a.getName();
        const nameB = b.getName();
        if (nameB === undefined) {
            return -1
        }
        if (nameA === undefined) {
            return 1;
        }
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        // names must be equal
        return 0;
    }

    async getAllCellars(): Promise<Cellar[]> {
        if (this.cachedCellars) {
            return this.cachedCellars;
        }
        this.cachedCellars = await this.cellarRepository.fetchCellars();
        return this.cachedCellars;
    }

    async getAllVisibleCellars(): Promise<Cellar[]> {
        const cellars = await this.getAllCellars();
        return cellars.filter(cellar => this.isVisible(cellar));
    }

    async getCellars(): Promise<Cellar[]> {
        var cellars: Cellar[] = await this.getAllVisibleCellars();
        const cellarWork = await this.getCellarCellarWork();
        if (cellarWork) {
            cellars.push(cellarWork);
        }
        const cellarAltglas = await this.getCellarAltglass();
        if (cellarAltglas) {
            cellars.push(cellarAltglas);
        }
        return cellars;
    }

    isVisible(cellar: Cellar): boolean {
        if (cellar.getDisplayOrder()) {
            return cellar.getDisplayOrder() > 0;
        }
        return true;
    }

    async getCellarById(cellarId: string): Promise<Cellar | null> {
        if (this.cachedCellars) {
            return this.cachedCellars.find(cellar => cellar.getId() === cellarId) ?? null;
        }
        this.cachedCellars = await this.cellarRepository.fetchCellars();
        return this.cachedCellars.find(cellar => cellar.getId() === cellarId) ?? null;
    }

    async createCellar(name: string): Promise<Cellar> {
        const cellar = await this.cellarRepository.createCellar(name);
        this.cachedCellars = null;
        return cellar;
    }

    async removeCellar(cellar: Cellar | undefined): Promise<void> {
        if (cellar) {
            if (await this.isEmpty(cellar)) {
                await this.cellarRepository.deleteCellar(cellar);
                this.cachedCellars = null;
            }
        }
    }

    /** True when the cellar holds no bottles (safe to delete). */
    async isCellarEmpty(cellar: Cellar): Promise<boolean> {
        return await this.isEmpty(cellar);
    }

    async getAllOrders(): Promise<Order[]> {
        if (this.cachedOrders) {
            return this.cachedOrders;
        }
        this.cachedOrders = await this.orderRespository.fetchOrders();
        return this.cachedOrders;
    }

    async ordersGroupedByMonth(filter: ProductFilter): Promise<Map<Date, Order[]>> {
        const orders = await this.getAllOrders();
        if (filter.hasRestrictions()) {
            console.log("ordersGroupedByMonth: with filter", filter);
            let filteredOrders: Order[] = orders.map(order => this.filterOrder(order, filter)).filter(order => order != null);
            return this.groupOrdersByMonth(filteredOrders);
        }
        return this.groupOrdersByMonth(orders);
    }

    async ingestOrdersFromInbox(): Promise<Cellar> {
        const cellarForCellarwork: Cellar = await this.cellarRepository.fetchCellarForCellarwork();
        const unprocessedOrders: Order[] = await this.orderRespository.fetchUnprocessedOrders();

        console.log("ingestOrdersFromInbox:", unprocessedOrders.length, "orders to", cellarForCellarwork.getId());
        if (unprocessedOrders.length > 0) {
            for (const order of unprocessedOrders) {
                await this.ingestOrder(order, cellarForCellarwork.getId());
            }
        }
        return cellarForCellarwork;
    }

    async ingestOrder(order: Order, cellarForCellarwork: string) {
        // Persist the freshly-built order (seller, customer, and order items
        // embedded in one document; items referencing the new local products),
        // then clear the source from the inbox — save-local-before-delete so a
        // failed deletion never loses an already-processed order.
        const processedOrder = await this.addBottles(order, cellarForCellarwork);
        await this.orderRespository.saveProcessedOrder(processedOrder);
        this.cachedOrders = null;
        await this.orderRespository.deleteFromInbox(order);
        this.cachedBottles = null;
        console.log("ingestOrder: processed order:", processedOrder.getId());
    }

    /**
     * Per-resource ingestion: for each order item, persist the product as its own
     * resource, then persist one bottle resource per ordered unit (each
     * referencing that product by URL). Returns the freshly-built order with its
     * seller, customer, and order items attached (to be saved as one document).
     */
    async addBottles(order: Order, cellarForCellarwork: string): Promise<Order> {
        const newOrder: Order = this.orderFactory.createOrder(order);

        for (const orderItem of order.getOrderItems() ?? []) {
            if (!orderItem.getOrderQuantity()) {
                continue;
            }
            const newOrderItem = this.orderFactory.createOrderItem(orderItem, newOrder);
            newOrder.addOrderItem(newOrderItem);

            const product = this.productFactory.createProduct(orderItem.getProduct(), newOrderItem);
            const savedProduct = await this.productRepository.save(product);
            // Embedded order item references the newly-created local product.
            this.orderFactory.linkProduct(newOrderItem, savedProduct);

            const bottles: Bottle[] = [];
            for (let q = 0; q < orderItem.getOrderQuantity(); q++) {
                const bottle: Bottle = this.bottleFactory.createFromProduct(savedProduct);
                bottle.setCellar(cellarForCellarwork);
                bottles.push(bottle);
            }
            await this.bottleRepository.saveAll(bottles);
        }
        return newOrder;
    }

    async disposeBottleToAltglass(bottle: Bottle, ratingValue?: number) {
        console.log("disposeBottleToAltglass: with id", bottle.getId());
        bottle.setCellar(this.getAltglassId());
        if (ratingValue !== undefined) {
            bottle.getProduct().createRating(ratingValue);
            await this.productRepository.save(bottle.getProduct());
        }
        await this.bottleRepository.save(bottle);
        this.cachedBottles = null;
    }

    async transferBottles(bottles: Bottle[], cellarIds: string[]): Promise<void> {
        const toSave: Bottle[] = [];
        for (let i = 0; i < bottles.length; i++) {
            if (cellarIds[i] != undefined) {
                bottles[i].setCellar(cellarIds[i]);
                toSave.push(bottles[i]);
            }
        }
        console.log("transferBottles: updating number of bottles", toSave.length);
        await this.bottleRepository.saveAll(toSave);
        this.cachedBottles = null;
    }

    // -----------------------------------------------------------------

    private isBottleInThisCellar(bottle: Bottle, cellar: Cellar | undefined) {
        if (cellar) {
            return cellar.getId() == bottle.getCellar();
        }
        return false;
    }

    private filterOrder(order: Order, filter: ProductFilter): Order | null {
        const orderItems = order.getOrderItems()?.filter(position => filter.filterProduct(position.getProduct()));
        if (orderItems && orderItems.length > 0) {
            return order;
        }
        return null;
    }

    private groupOrdersByMonth(orders: Order[]): Map<Date, Order[]> {
        const unknownDate = new Date(1900, 0, 1);
        const dates: Map<string, Date> = new Map();
        const grouped = new Map<Date, Order[]>();
        for (const order of orders) {
            let dateKey: Date;
            if (order.getOrderDate()) {
                dateKey = this.getDateKey(order.getOrderDate(), dates);
            } else {
                dateKey = unknownDate;
            }
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)?.push(order);
        }
        return new Map([...grouped.entries()].sort(([a], [b]) => b.getTime() - a.getTime()));
    }

    private getDateKey(date: Date, dates: Map<string, Date>): Date {
        const key: string = `${date.getFullYear()}-${date.getMonth()}-1`;
        var dateKey = dates.get(key);
        if (dateKey) {
            return dateKey;
        } else {
            dateKey = new Date(date.getFullYear(), date.getMonth(), 1)
            dates.set(key, dateKey);
            return dateKey;
        }

    }

    private async isEmpty(cellar: Cellar) {
        const bottles = await this.bottlesFromCellar(cellar, new ProductFilter());
        if (bottles.length > 0) {
            return false;
        }
        return true;
    }

}