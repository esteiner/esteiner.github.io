import { fetch } from "@inrupt/solid-client-authn-browser";
import {deleteSolidDataset} from "@inrupt/solid-client";
import {ProductFilter} from "../domain/Product/ProductFilter.ts";
import type {BottlesDocumentRepository} from "../domain/Bottle/BottlesDocumentRepository.ts";
import type {BottlesDocument} from "../domain/Bottle/BottlesDocument.ts";
import type {Bottle} from "../domain/Bottle/Bottle.ts";
import type {Product} from "../domain/Product/Product.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {Cellar} from "../domain/Cellar/Cellar.ts";
import type {BottleFactory} from "../domain/Bottle/BottleFactory.ts";
import type {ProductFactory} from "../domain/Product/ProductFactory.ts";
import type {OrderFactory} from "../domain/Order/OrderFactory.ts";
import type {Order} from "../domain/Order/Order.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";
import {SoukaiOrder} from "../infrastructure/soukai/model/SoukaiOrder.ts";

/**
 * Application Use Case: Get Profile
 * Retrieves the Solid profile for a given WebID
 */
export class KellermeisterService {

    private cachedBottlesDocument: BottlesDocument | undefined = undefined;
    //private bottlesContainer: BottlesContainer | null = null;
    private cachedCellars: Cellar[] | null = null;
    private cachedOrders: Order[] | null = null;

    constructor(private cellarRepository: CellarRepository, private bottleStorageRepository: BottlesDocumentRepository, private orderRespository: OrderRepository, private bottleFactory: BottleFactory, private orderFactory: OrderFactory, private productFactory: ProductFactory) {
    }

    getAltglassId(): string {
        return this.cellarRepository.getAltglassId();
    }

    async getCellarAltglass(): Promise<Cellar | null> {
        return this.cellarRepository.fetchCellarForAltglass();
    }

    getCellarWorkId(): string {
        return this.cellarRepository.getCellarWorkId();
    }

    async getCellarCellarWork(): Promise<Cellar> {
        return this.cellarRepository.fetchCellarForCellarwork();
    }

    async getAllBottles(): Promise<Bottle[]> {
        const bottlesStorage: BottlesDocument | undefined = await this.getCachedBottlesDocument();
        if (bottlesStorage) {
            return bottlesStorage.getBottles();
        } else {
            console.log("getAllBottles: bottles storage not found")
            return new Array();
        }

    }

    /**
     * Returns a map with the product.id as key and an array of bottles as value.
     */
    async searchBottlesGroupedByCellar(filter: ProductFilter): Promise<Map<Cellar, Map<string, Bottle[]>>> {
        const [bottles, cellars] = await Promise.all([this.getAllBottles(), this.getAllCellars()]);
        const cellarMap = new Map<string, Cellar>(cellars.map(c => [c.getId(), c]));
        const grouped = new Map<string, Map<string, Bottle[]>>();

        for (const bottle of bottles) {
            if (bottle.getProduct() && bottle.getCellar() && filter.filterProduct2(bottle.getProduct())) {
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
                result.set(cellar, grouped.get(cellarId)!);
            }
        }
        return result;
    }

    async bottlesFromCellarGroupedByProduct(cellar: Cellar | undefined, filter: ProductFilter): Promise<Map<string, Bottle[]>> {
        const bottles = await this.getAllBottles();
        const grouped = new Map<string, Bottle[]>();

        for (const bottle of bottles) {
            if (bottle.getProduct() && this.isBottleInThisCellar(bottle, cellar) && filter.filterProduct2(bottle.getProduct())) {
                //console.log("bottlesFromCellarGroupedByProduct", bottle.getProduct().getName());
                if (!grouped.has(bottle.getProduct().getName())) {
                    grouped.set(bottle.getProduct().getName(), []);
                }
                grouped.get(bottle.getProduct().getName())?.push(bottle);
            }
        }
        return new Map([...grouped.entries()].sort(([a], [b]) => b.toLowerCase().localeCompare(a.toLowerCase())));
    }

    /**
     * Returns a map with the product.id as key and an array of bottles as value.
     */
    async bottlesFromCellar(cellar: Cellar | undefined, filter: ProductFilter): Promise<Bottle[]> {
        const bottles = await this.getAllBottles();
        return bottles.filter(bottle => cellar?.getId() === bottle.getCellar()).filter(bottle => filter.filterProduct2(bottle.getProduct()))
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
        if (this.cachedCellars) {
            return this.cachedCellars.filter(cellar => this.isVisible(cellar));
        }
        this.cachedCellars = await this.cellarRepository.fetchCellars();
        return this.cachedCellars.filter(cellar => this.isVisible(cellar));
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
                this.cellarRepository.deleteCellar(cellar);
                this.cachedCellars = null;
            }
        }
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

        console.log(`ingestOrdersFromInbox: ${unprocessedOrders.length} orders to ${cellarForCellarwork.getId()}`);
        if (unprocessedOrders.length > 0) {
            for (const order of unprocessedOrders) {
                await this.ingestOrder(order, cellarForCellarwork.getId());
            }
        }
        return cellarForCellarwork;
    }

    async ingestOrder(order: Order, cellarForCellarwork: string) {
        console.log("ingestOrder: order:", order);
        const bottlesDocument = await this.getCachedBottlesDocument();
        if (bottlesDocument) {
            this.addBottles(bottlesDocument, order, cellarForCellarwork);
            await this.saveBottlesDocument();
            await this.moveProcessedOrders(new Array(order));
            console.log("ingestOrdersFromInbox: processed order:", order);
        }
    }

    async saveBottlesDocument(): Promise<void> {
        const cachedBottlesDocument = await this.getCachedBottlesDocument();
        if (cachedBottlesDocument) {
            cachedBottlesDocument.save();
        }
    }

    addBottles(bottlesDocument: BottlesDocument, order: Order, cellarForCellarwork: string) {
        const newOrder: Order = this.orderFactory.createOrder(order);

        if (order.getOrderItems()) {
            // const newPositions: OrderItem[] = new Array();
            for (const orderItem of order.getOrderItems()) {
                if (orderItem.getOrderQuantity()) {
                    const newOrderItem = this.orderFactory.createOrderItem(orderItem, newOrder);
                    // newPositions.push(newOrderItem);
                    newOrder.addOrderItem(newOrderItem);

                    const product = this.productFactory.createProduct(orderItem.getProduct(), newOrderItem);
                    for (let q = 0; q < orderItem.getOrderQuantity(); q++) {
                        const bottle: Bottle = this.bottleFactory.createFromProduct(product);
                        bottle.setCellar(cellarForCellarwork);
                        bottlesDocument.addBottle(bottle);
                    }
                }
            }
            // newOrder.positions = newPositions;
        }

    }

    async disposeBottleToAltglass2(bottle: Bottle, rating?: number) {
        console.log("disposeBottleToAltglass2: with id", bottle.getId());
        const bottlesStorage = await this.getCachedBottlesDocument();
        if (bottlesStorage) {
            bottle.setCellar(this.getAltglassId());
            if (rating !== undefined) {
                bottle.setRating(rating);
            }
            console.log("disposeBottleToAltglass2: with rating", rating);
            await this.bottleStorageRepository.save(bottlesStorage);
        }
    }

    async transferBottles(bottles: Bottle[], cellarIds: string[]): Promise<BottlesDocument | undefined> {
        console.log("transferBottles: checking number of bottles", bottles.length);
        const bottlesStorage = await this.getCachedBottlesDocument();
        var transferred: number = 0;
        if (bottlesStorage) {
            for (var i = 0; i < bottles.length; i++) {
                if (cellarIds[i] != undefined) {
                    bottles[i].setCellar(cellarIds[i]);
                    transferred++;
                }
            }
            console.log("transferBottles: updating number of bottles", transferred);
            await this.bottleStorageRepository.save(bottlesStorage);
            console.log("transferBottles: updated bottles", transferred);
            return await this.fetchBottlesStorage();
        }
        return bottlesStorage;
        // const bottlesContainer: BottlesContainer | null = await this.fetchBottles();
        // var transferred: number = 0;
        // if (bottlesContainer) {
        //     for (var i = 0; i < bottles.length; i++) {
        //         if (cellarIds[i] != undefined) {
        //             bottlesContainer.transferBottle(bottles[i], cellarIds[i]);
        //             transferred++;
        //         }
        //     }
        // }
        // if (bottlesContainer?.isDirty) {
        //     console.log("transferBottles: updating number of bottles", transferred);
        //     const savedBottlesContainer: BottlesContainer | null = await this.saveBottles();
        //     console.log("transferBottles: updated bottles", transferred);
        //     return savedBottlesContainer;
        // }
        // return bottlesContainer;
    }

    // -----------------------------------------------------------------

    private async getCachedBottlesDocument(): Promise<BottlesDocument | undefined> {
        if (!this.cachedBottlesDocument) {
            console.log("getCachedBottlesDocument: cache is empty");
            this.cachedBottlesDocument = await this.bottleStorageRepository.fetchBottlesStorage();
        }
        return this.cachedBottlesDocument;
    }

    private async fetchBottlesStorage(): Promise<BottlesDocument | undefined> {
        return await this.bottleStorageRepository.fetchBottlesStorage();
    }

    private isBottleInThisCellar(bottle: Bottle, cellar: Cellar | undefined) {
        if (cellar) {
            return cellar.getId() == bottle.getCellar();
        }
        return false;
    }

    private filterOrder(order: Order, filter: ProductFilter): Order | null {
        const orderItems = order.getOrderItems()?.filter(position => filter.filterProduct2(position.getProduct()));
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

    private async moveProcessedOrders(unprocessedOrders: Order[]) {
        for (const order of unprocessedOrders) {
            await this.moveProcessedOrder(order);
        }
    }

    private async moveProcessedOrder(unprocessedOrder: Order) {
        if (unprocessedOrder instanceof SoukaiOrder) {
            console.log("moveProcessedOrder: moving order:", unprocessedOrder.getSourceDocumentUrl());
            await this.orderRespository.saveProcessedOrder(unprocessedOrder.clone())
            this.cachedOrders = null;
            // Delete from source
            if (unprocessedOrder.getSourceDocumentUrl()) {
                await deleteSolidDataset(unprocessedOrder.getSourceDocumentUrl() as string, { fetch: fetch });
            }
        }
    }

}