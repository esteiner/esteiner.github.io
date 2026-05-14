import {SolidBottle} from "../domain/Bottle/SolidBottle.ts";
import type {Cellar} from "../domain/Cellar/Cellar.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";
import {SolidOrder} from "../domain/Order/SolidOrder.ts";
import {BottlesContainer} from "../domain/Bottle/BottlesContainer.ts";
import {ProductFilter} from "../domain/Product/ProductFilter.ts";
import type {BottlesContainerRepository} from "../domain/Bottle/BottlesContainerRepository.ts";
import type {BottlesStorageRepository} from "../domain/Bottle/BottlesStorageRepository.ts";
import type {BottleFactory} from "../domain/Bottle/BottleFactory.ts";
import {SolidProduct} from "../domain/Product/SolidProduct.ts";
import {ProductFactory} from "../domain/Product/ProductFactory.ts";
import {OrderFactory} from "../domain/Order/OrderFactory.ts";
import {deleteSolidDataset} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";
import {SolidOrderItem} from "../domain/Order/SolidOrderItem";
import type {BottlesStorage} from "../domain/Bottle/BottlesStorage.ts";
import type {Bottle} from "../domain/Bottle/Bottle.ts";

/**
 * Application Use Case: Get Profile
 * Retrieves the Solid profile for a given WebID
 */
export class KellermeisterService {

    private bottlesContainer: BottlesContainer | null = null;
    private cachedCellars: Cellar[] | null = null;
    private cachedOrders: SolidOrder[] | null = null;

    constructor(private cellarRepository: CellarRepository, private bottleStorageRepository: BottlesStorageRepository, private bottlesContainerRepository: BottlesContainerRepository, private orderRespository: OrderRepository, private bottleFactory: BottleFactory, private orderFactory: OrderFactory, private productFactory: ProductFactory) {
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

    async getAllBottles2(): Promise<Bottle[]> {
        const bottlesStorage: BottlesStorage | undefined = await this.fetchBottlesStorage();
        if (bottlesStorage) {
            return bottlesStorage.getBottles();
        } else {
            console.log("getAllBottles: bottles storage not found")
            return new Array();
        }

    }
    async getAllBottles(): Promise<SolidBottle[]> {
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
    async searchBottlesGroupedByCellar(filter: ProductFilter): Promise<Map<Cellar, Map<string, SolidBottle[]>>> {
        const [bottles, cellars] = await Promise.all([this.getAllBottles(), this.getAllCellars()]);
        const cellarMap = new Map<string, Cellar>(cellars.map(c => [c.id, c]));
        const grouped = new Map<string, Map<string, SolidBottle[]>>();

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

        const result = new Map<Cellar, Map<string, SolidBottle[]>>();
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
        const bottles = await this.getAllBottles2();
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
    async bottlesFromCellar(cellar: Cellar | undefined, filter: ProductFilter): Promise<SolidBottle[]> {
        const bottles = await this.getAllBottles();
        return bottles.filter(bottle => cellar?.id === bottle.cellar).filter(bottle => filter.filterProduct(bottle.product))
            .sort((a: SolidBottle, b: SolidBottle) => this.productComparator(a.product, b.product));
    }

    productComparator(a: SolidProduct, b: SolidProduct): number {
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

    async getAllOrders(): Promise<SolidOrder[]> {
        if (this.cachedOrders) {
            return this.cachedOrders;
        }
        this.cachedOrders = await this.orderRespository.fetchOrders();
        return this.cachedOrders;
    }

    async ordersGroupedByMonth(filter: ProductFilter): Promise<Map<Date, SolidOrder[]>> {
        const orders = await this.getAllOrders();
        if (filter.hasRestrictions()) {
            console.log("ordersGroupedByMonth: with filter", filter);
            let filteredOrders: SolidOrder[] = orders.map(order => this.filterOrder(order, filter)).filter(order => order != null);
            return this.groupOrdersByMonth(filteredOrders);
        }
        return this.groupOrdersByMonth(orders);
    }

    async ingestOrdersFromInbox(): Promise<Cellar> {
        const cellarForCellarwork: Cellar = await this.cellarRepository.fetchCellarForCellarwork();
        const unprocessedOrders: SolidOrder[] = await this.orderRespository.fetchUnprocessedOrders();

        console.log(`ingestOrdersFromInbox: ${unprocessedOrders.length} orders to ${cellarForCellarwork.id}`);
        if (unprocessedOrders.length > 0) {
            for (const order of unprocessedOrders) {
                await this.ingestOrder(order, cellarForCellarwork.id);
            }
        }
        return cellarForCellarwork;
    }

    async ingestOrder(order: SolidOrder, cellarForCellarwork: string) {
        console.log("ingestOrder: order:", order);
        const bottlesContainer = await this.loadBottles();
        if (bottlesContainer) {
            this.addBottles(bottlesContainer, order, cellarForCellarwork);
            if (bottlesContainer.isDirty()) {
                await this.saveBottles();
                await this.moveProcessedOrders(new Array(order));
                console.log("ingestOrdersFromInbox: processed order:", order);
            }
        }
    }

    addBottles(bottlesContainer: BottlesContainer, order: SolidOrder, cellarForCellarwork: string) {
        const newOrder: SolidOrder = this.orderFactory.createOrder(order);

        if (order.positions) {
            const newPositions: SolidOrderItem[] = new Array();
            for (const orderItem of order.positions) {
                if (orderItem.orderQuantity) {
                    const newOrderItem = this.orderFactory.createOrderItem(orderItem, newOrder);
                    newPositions.push(newOrderItem);

                    const product = this.productFactory.createProduct(orderItem.product, newOrderItem);
                    for (let q = 0; q < orderItem.orderQuantity; q++) {
                        const bottle: SolidBottle = this.bottleFactory.createFromProduct(product);
                        bottle.cellar = cellarForCellarwork;
                        bottlesContainer.addBottle(bottle);
                    }
                }
            }
            newOrder.positions = newPositions;
        }

    }

    async disposeBottleToAltglass(bottle: SolidBottle, rating?: number) {
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

    async disposeBottleToAltglass2(bottle: Bottle, rating?: number) {
        const bottlesStorage = await this.fetchBottlesStorage();
        if (bottlesStorage) {
            if (rating !== undefined) {
                bottlesStorage.rateBottle(bottle.getId(), rating);
            }
            // bottlesStorage.transferBottle(bottle, this.getAltglassId());
            if (bottlesStorage.isModified()) {
                console.log(`disposeBottleToAltglass2: ${rating}`);
                await bottlesStorage.persist();
            }
        }
        // const bottlesContainer: BottlesContainer | null = await this.fetchBottles();
        // if (bottlesContainer) {
        //     if (rating !== undefined) {
        //         bottlesContainer.rateBottle(bottle, rating);
        //     }
        //     bottlesContainer.transferBottle(bottle, this.getAltglassId());
        //     if (bottlesContainer.isDirty()) {
        //         await bottlesContainer.save();
        //         this.bottlesContainer = null;
        //     }
        // }
    }

    async transferBottles(bottles: SolidBottle[], cellarIds: string[]): Promise<BottlesContainer | null> {
        console.log("transferBottles: checking number of bottles", bottles.length);
        const bottlesContainer: BottlesContainer | null = await this.fetchBottles();
        var transferred: number = 0;
        if (bottlesContainer) {
            for (var i = 0; i < bottles.length; i++) {
                if (cellarIds[i] != undefined) {
                    bottlesContainer.transferBottle(bottles[i], cellarIds[i]);
                    transferred++;
                }
            }
        }
        if (bottlesContainer?.isDirty) {
            console.log("transferBottles: updating number of bottles", transferred);
            const savedBottlesContainer: BottlesContainer | null = await this.saveBottles();
            console.log("transferBottles: updated bottles", transferred);
            return savedBottlesContainer;
        }
        return bottlesContainer;
    }

    // -----------------------------------------------------------------

    private async fetchBottlesStorage(): Promise<BottlesStorage | undefined> {
        return await this.bottleStorageRepository.fetchBottlesStorage();
    }

    private async fetchBottles(): Promise<BottlesContainer | null> {
        await this.fetchBottlesStorage();
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

    private async saveBottles(): Promise<BottlesContainer | null> {
        if (this.bottlesContainer) {
            console.log("saveBottles: saving number of bottles", this.bottlesContainer.bottles.length);
            const savedBottlesContainer = await this.bottlesContainer.save();
            console.log("saveBottles: saved number of bottles", savedBottlesContainer.bottles.length);
            this.bottlesContainer = savedBottlesContainer;
        }
        return this.bottlesContainer;
    }

    private isBottleInThisCellar(bottle: Bottle, cellar: Cellar | undefined) {
        if (cellar) {
            return cellar.id == bottle.getCellar();
        }
        return false;
    }

    private filterOrder(order: SolidOrder, filter: ProductFilter): SolidOrder | null {
        const orderItems = order.positions?.filter(position => filter.filterProduct(position.product));
        if (orderItems && orderItems.length > 0) {
            const filteredOrder = new SolidOrder();
            filteredOrder.orderDate = order.orderDate;
            filteredOrder.orderNumber = order.orderNumber;
            filteredOrder.seller = order.seller;
            filteredOrder.customer = order.customer;
            filteredOrder.positions = orderItems;
            return filteredOrder;
        }
        return null;
    }

    private groupOrdersByMonth(orders: SolidOrder[]): Map<Date, SolidOrder[]> {
        const unknownDate = new Date(1900, 0, 1);
        const dates: Map<string, Date> = new Map();
        const grouped = new Map<Date, SolidOrder[]>();
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

    private async moveProcessedOrders(unprocessedOrders: SolidOrder[]) {
        for (const order of unprocessedOrders) {
            await this.moveProcessedOrder(order);
        }
    }

    private async moveProcessedOrder(unprocessedOrder: SolidOrder) {
        console.log("moveProcessedOrder: moving order:", unprocessedOrder.getSourceDocumentUrl());
        await this.orderRespository.saveProcessedOrder(unprocessedOrder.clone())
        this.cachedOrders = null;
        // Delete from source
        if (unprocessedOrder.getSourceDocumentUrl()) {
            await deleteSolidDataset(unprocessedOrder.getSourceDocumentUrl() as string, { fetch: fetch });
        }
    }

}