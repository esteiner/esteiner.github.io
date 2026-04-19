import {Bottle} from "../domain/Bottle/Bottle.ts";
import type {Cellar} from "../domain/Cellar/Cellar.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";
import {Order} from "../domain/Order/Order.ts";
import {BottlesContainer} from "../domain/Bottle/BottlesContainer.ts";
import {ProductFilter} from "../domain/Product/ProductFilter.ts";
import type {BottlesContainerRepository} from "../domain/Bottle/BottlesContainerRepository.ts";
import type {BottleFactory} from "../domain/Bottle/BottleFactory.ts";
import {Product} from "../domain/Product/Product.ts";
import {ProductFactory} from "../domain/Product/ProductFactory.ts";
import {OrderFactory} from "../domain/Order/OrderFactory.ts";
import {deleteSolidDataset} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import {OrderItem} from "../domain/Order/OrderItem";

/**
 * Application Use Case: Get Profile
 * Retrieves the Solid profile for a given WebID
 */
export class KellermeisterService {

    private bottlesContainer: BottlesContainer | null = null;
    private cachedCellars: Cellar[] | null = null;
    private cachedOrders: Order[] | null = null;

    constructor(private cellarRepository: CellarRepository, private bottlesContainerRepository: BottlesContainerRepository, private orderRespository: OrderRepository, private bottleFactory: BottleFactory, private orderFactory: OrderFactory, private productFactory: ProductFactory) {
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
        const bottlesContainer: BottlesContainer | null = await this.fetchBottles();
        if (bottlesContainer) {
            return bottlesContainer.bottles;
        } else {
            console.log("getAllBottles: bottles container not found")
            return new Array();
        }
    }

    /**
     * Returns a map with the product.id as key and an array of bottles as value.
     */
    async searchBottlesGroupedByCellar(filter: ProductFilter): Promise<Map<Cellar, Map<string, Bottle[]>>> {
        const [bottles, cellars] = await Promise.all([this.getAllBottles(), this.getAllCellars()]);
        const cellarMap = new Map<string, Cellar>(cellars.map(c => [c.id, c]));
        const grouped = new Map<string, Map<string, Bottle[]>>();

        for (const bottle of bottles) {
            if (bottle.product && bottle.cellar && filter.filterProduct(bottle.product)) {
                if (!grouped.has(bottle.cellar)) {
                    grouped.set(bottle.cellar, new Map());
                }
                const byProduct = grouped.get(bottle.cellar)!;
                if (!byProduct.has(bottle.product.id)) {
                    byProduct.set(bottle.product.id, []);
                }
                byProduct.get(bottle.product.id)!.push(bottle);
            }
        }

        const result = new Map<Cellar, Map<string, Bottle[]>>();
        const toSortKey = (c: Cellar) => {
            const d = c.displayOrder ?? 0;
            return d < 0 ? Number.MAX_SAFE_INTEGER : d;
        };
        const sortedCellarIds = [...grouped.keys()].sort((a, b) => {
            const ca = cellarMap.get(a);
            const cb = cellarMap.get(b);
            if (!ca || !cb) return 0;
            const orderDiff = toSortKey(ca) - toSortKey(cb);
            if (orderDiff !== 0) return orderDiff;
            return (ca.name ?? '').localeCompare(cb.name ?? '');
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
            if (bottle.product && this.isBottleInThisCellar(bottle, cellar) && filter.filterProduct(bottle.product)) {
                console.log("bottlesFromCellarGroupedByProduct", bottle.product.id);
                if (!grouped.has(bottle.product.id)) {
                    grouped.set(bottle.product.id, []);
                }
                grouped.get(bottle.product.id)?.push(bottle);
            }
        }
        return new Map([...grouped.entries()].sort(([a], [b]) => b.toLowerCase().localeCompare(a.toLowerCase())));
    }

    /**
     * Returns a map with the product.id as key and an array of bottles as value.
     */
    async bottlesFromCellar(cellar: Cellar | undefined, filter: ProductFilter): Promise<Bottle[]> {
        const bottles = await this.getAllBottles();
        return bottles.filter(bottle => cellar?.id === bottle.cellar).filter(bottle => filter.filterProduct(bottle.product))
            .sort((a: Bottle, b: Bottle) => this.productComparator(a.product, b.product));
    }

    productComparator(a: Product, b: Product): number {
        const nameA = a.name;
        const nameB = b.name;
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
        if (cellar.displayOrder) {
            return cellar.displayOrder > 0;
        }
        return true;
    }

    async getCellarById(cellarId: string): Promise<Cellar | null> {
        if (this.cachedCellars) {
            return this.cachedCellars.find(cellar => cellar.id === cellarId) ?? null;
        }
        this.cachedCellars = await this.cellarRepository.fetchCellars();
        return this.cachedCellars.find(cellar => cellar.id === cellarId) ?? null;
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

        console.log(`ingestOrdersFromInbox: ${unprocessedOrders.length} orders to ${cellarForCellarwork.id}`);
        if (unprocessedOrders.length > 0) {
            await this.loadBottles();
            const bottles = this.bottlesContainer;
            if (bottles) {
                unprocessedOrders.forEach(order => this.ingestOrder(order, cellarForCellarwork.id, bottles));
                if (bottles.isDirty()) {
                    this.saveBottles();
                    this.moveProcessedOrders(unprocessedOrders);
                    console.log("ingestOrdersFromInbox: processed orders:", unprocessedOrders.length);
                }
            }
        }
        return cellarForCellarwork;
    }

    ingestOrder(order: Order, cellarForCellarwork: string, bottlesContainer: BottlesContainer) {
        console.log("ingestOrder: order:", order);
        this.addBottles(bottlesContainer, order, cellarForCellarwork);
    }

    addBottles(bottlesContainer: BottlesContainer, order: Order, cellarForCellarwork: string) {
        const newOrder: Order = this.orderFactory.createOrder(order);

        if (order.positions) {
            const newPositions: OrderItem[] = new Array();
            for (const orderItem of order.positions) {
                if (orderItem.orderQuantity) {
                    const newOrderItem = this.orderFactory.createOrderItem(orderItem, newOrder);
                    newPositions.push(newOrderItem);

                    const product = this.productFactory.createProduct(orderItem.product, newOrderItem);
                    for (let q = 0; q < orderItem.orderQuantity; q++) {
                        const bottle: Bottle = this.bottleFactory.createFromProduct(product);
                        bottle.cellar = cellarForCellarwork;
                        bottlesContainer.addBottle(bottle);
                    }
                }
            }
            newOrder.positions = newPositions;
        }

    }

    async disposeBottleToAltglass(bottle: Bottle, rating?: number) {
        const bottlesContainer: BottlesContainer | null = await this.fetchBottles();
        if (bottlesContainer) {
            if (rating !== undefined) {
                bottlesContainer.rateBottle(bottle, rating);
            }
            bottlesContainer.transferBottle(bottle, this.getAltglassId());
            if (bottlesContainer.isDirty()) {
                await bottlesContainer.save();
                this.bottlesContainer = null;
            }
        }
    }

    async transferBottles(bottles: Bottle[], cellarIds: string[]) {
        const bottlesContainer: BottlesContainer | null = await this.fetchBottles();
        if (bottlesContainer) {
            for (var i = 0; i < bottles.length; i++) {
                if (cellarIds[i] != undefined) {
                    bottlesContainer.transferBottle(bottles[i], cellarIds[i]);
                }
            }
        }
        if (bottlesContainer?.isDirty) {
            await bottlesContainer.save();
            this.bottlesContainer = null;
        }
    }

    // -----------------------------------------------------------------

    private async fetchBottles(): Promise<BottlesContainer | null> {
        if (this.bottlesContainer) {
            console.log("fetchBottles: from cache");
            return this.bottlesContainer;
        } else {
            const bottlesContainer: BottlesContainer | null = await this.bottlesContainerRepository.fetchBottles();
            if (bottlesContainer) {
                this.bottlesContainer = bottlesContainer;
                return this.bottlesContainer;
            } else {
                console.log("fetchBottles: bottles container not found")
                return null;
            }
        }
    }

    private async loadBottles(): Promise<BottlesContainer | null> {
        console.log("loadBottles: from repository");
        const bottlesContainer: BottlesContainer | null = await this.bottlesContainerRepository.fetchBottles();
        if (bottlesContainer) {
            this.bottlesContainer = bottlesContainer;
            return this.bottlesContainer;
        } else {
            console.log("fetchBottles: bottles container not found")
            return null;
        }
    }

    private async saveBottles(): Promise<void> {
        console.log("saveBottles: to repository");
        if (this.bottlesContainer) {
            await this.bottlesContainer.save();
            await this.loadBottles();
        }
    }

    private isBottleInThisCellar(bottle: Bottle, cellar: Cellar | undefined) {
        if (cellar) {
            return cellar.id == bottle.cellar;
        }
        return false;
    }

    private filterOrder(order: Order, filter: ProductFilter): Order | null {
        const orderItems = order.positions?.filter(position => filter.filterProduct(position.product));
        if (orderItems && orderItems.length > 0) {
            const filteredOrder = new Order();
            filteredOrder.orderDate = order.orderDate;
            filteredOrder.orderNumber = order.orderNumber;
            filteredOrder.seller = order.seller;
            filteredOrder.customer = order.customer;
            filteredOrder.positions = orderItems;
            return filteredOrder;
        }
        return null;
    }

    private groupOrdersByMonth(orders: Order[]): Map<Date, Order[]> {
        const unknownDate = new Date(1900, 0, 1);
        const dates: Map<string, Date> = new Map();
        const grouped = new Map<Date, Order[]>();
        for (const order of orders) {
            let dateKey: Date;
            if (order.orderDate) {
                dateKey = this.getDateKey(order.orderDate, dates);
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
        unprocessedOrders.forEach(order => this.moveProcessedOrder(order));
    }

    private async moveProcessedOrder(unprocessedOrder: Order) {
        console.log("moveProcessedOrder: moving order:", unprocessedOrder.getSourceDocumentUrl());
        await this.orderRespository.saveProcessedOrder(unprocessedOrder.clone())
        this.cachedOrders = null;
        // Delete from source
        if (unprocessedOrder.getSourceDocumentUrl()) {
            await deleteSolidDataset(unprocessedOrder.getSourceDocumentUrl() as string, { fetch: fetch });
        }
    }

}