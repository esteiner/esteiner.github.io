import {Bottle} from "../domain/Bottle/Bottle.ts";
import type {Cellar} from "../domain/Cellar/Cellar.ts";
import type {CellarRepository} from "../domain/Cellar/CellarRepository.ts";
import type {OrderRepository} from "../domain/Order/OrderRepository.ts";
import {Order} from "../domain/Order/Order.ts";
import type {OrderItem} from "../domain/Order/OrderItem.ts";
import {BottlesContainer} from "../domain/Bottle/BottlesContainer.ts";
import type {BottlesContainerRepository} from "../domain/Bottle/BottlesContainerRepository.ts";
import type {BottleFactory} from "../domain/Bottle/BottleFactory.ts";
import {Product} from "../domain/Product/Product.ts";
import {
    deleteSolidDataset
} from "@inrupt/solid-client";
import { fetch } from "@inrupt/solid-client-authn-browser";

/**
 * Application Use Case: Get Profile
 * Retrieves the Solid profile for a given WebID
 */
export class KellermeisterService {

    constructor(private cellarRepository: CellarRepository, private bottlesContainerRepository: BottlesContainerRepository, private orderRespository: OrderRepository, private bottleFactory: BottleFactory) {
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
        const bottlesContainer: BottlesContainer | null = await this.bottlesContainerRepository.fetchBottlesContainer();
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
    async bottlesFromCellarGroupedByProduct(cellar: Cellar): Promise<Map<string, Bottle[]>> {
        const bottles = await this.getAllBottles();
        const grouped = new Map<string, Bottle[]>();

        for (const bottle of bottles) {
            if (bottle.product && this.isBottleInThisCellar(bottle, cellar)) {
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
    async bottlesFromCellar(cellar: Cellar): Promise<Bottle[]> {
        const bottles = await this.getAllBottles();
        return bottles.filter(bottle => cellar.id === bottle.cellar)
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
        return this.cellarRepository.fetchCellars();
    }

    async getCellarById(cellarId: string): Promise<Cellar | null> {
        return this.cellarRepository.fetchCellarById(cellarId);
    }

    async createCellar(name: string): Promise<Cellar> {
        return this.cellarRepository.createCellar(name);
    }

    async removeCellar(cellar: Cellar | undefined): Promise<void> {
        if (cellar) {
            if (await this.isEmpty(cellar)) {
                this.cellarRepository.deleteCellar(cellar);
            }
        }
    }

    async getAllOrders(): Promise<Order[]> {
        return this.orderRespository.fetchOrders();
    }

    async ordersGroupedByMonth(): Promise<Map<Date, Order[]>> {
        const orders = await this.getAllOrders();
        return this.groupOrdersByMonth(orders);
    }

    async ingestOrdersFromInbox(): Promise<Cellar> {
        const cellarForCellarwork: Cellar = await this.cellarRepository.fetchCellarForCellarwork();
        const unprocessedOrders: Order[] = await this.orderRespository.fetchUnprocessedOrders();
        console.log(`ingestOrdersFromInbox: ${unprocessedOrders.length} orders to ${cellarForCellarwork.id}`);

        if (unprocessedOrders.length > 0) {
            const bottlesContainer: BottlesContainer | null = await this.bottlesContainerRepository.fetchBottlesContainer();
            if (bottlesContainer) {
                unprocessedOrders.forEach(order => this.ingestOrder(order, cellarForCellarwork.id, bottlesContainer));

                if (bottlesContainer.isDirty()) {
                    await bottlesContainer.save();
                    this.moveProcessedOrders(unprocessedOrders);
                    console.log("ingestOrdersFromInbox: processed orders:", unprocessedOrders.length);
                } else {
                    console.log("ingestOrderItems: no orders processed");
                }
            }
        }
        return cellarForCellarwork;
    }

    async ingestOrder(order: Order, cellarForCellarwork: string, bottlesContainer: BottlesContainer) {
        console.log("ingestOrder: order:", order);
        if (order.positions) {
            var unprocessedOrderItems: OrderItem[] = order.positions
                .filter(item => item != undefined)
                .map(item => this.explode(item))
                .flatMap(orderItems => orderItems);

            const products: Product[] = bottlesContainer.products();
            console.log("ingestOrderItems: existing products:", products);
            var processedOrderItem: OrderItem | undefined = undefined;
            for (var i = 0; i < unprocessedOrderItems.length; i++) {
                if (cellarForCellarwork != undefined) {
                    processedOrderItem = unprocessedOrderItems[i];
                    const bottle: Bottle = this.bottleFactory.createFromOrderItem(this.getOrCreateProduct(products, processedOrderItem.product), processedOrderItem);
                    bottle.cellar = cellarForCellarwork;
                    console.log("ingestOrderItems: bottle:", bottle.product?.name, "to cellar:", bottle.cellar);
                    bottlesContainer.addBottle(bottle);
                } else {
                    console.log("ingestOrderItems: cellar not assigned for:", processedOrderItem);
                }
            }
        }
    }

    async transferBottles(bottles: Bottle[], cellarIds: string[]) {
        const bottlesContainer: BottlesContainer | null = await this.bottlesContainerRepository.fetchBottlesContainer();
        if (bottlesContainer) {
            for (var i = 0; i < bottles.length; i++) {
                if (cellarIds[i] != undefined) {
                    bottlesContainer.transferBottle(bottles[i], cellarIds[i]);
                }
            }
        }
        if (bottlesContainer?.isDirty) {
            await bottlesContainer.save();
        }
    }
    
    // -----------------------------------------------------------------

    private isBottleInThisCellar(bottle: Bottle, cellar: Cellar) {
        if (cellar) {
            return cellar.id == bottle.cellar;
        }
        return false;
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
        const bottles = await this.bottlesFromCellar(cellar);
        if (bottles.length > 0) {
            return false;
        }
        return true;
    }

    private getOrCreateProduct(products: Product[], productFromOrderItem: Product): Product {
        console.log("getOrCreateProduct: products:", products);
        const filtered = products.filter(product => product.name === productFromOrderItem.name);
        if (filtered.length > 0) {
            console.log("getOrCreateProduct: found:", filtered[0]);
            return filtered[0];
        } else {
            const newProduct: Product = new Product();
            newProduct.name = productFromOrderItem.name;
            newProduct.productionDate = productFromOrderItem.productionDate;
            newProduct.hersteller = productFromOrderItem.hersteller;
            newProduct.weinart = productFromOrderItem.weinart;
            newProduct.milliliter = productFromOrderItem.milliliter;
            newProduct.region = productFromOrderItem.region;
            newProduct.land = productFromOrderItem.land;
            newProduct.traubensorte = productFromOrderItem.traubensorte;
            newProduct.klassifikation = productFromOrderItem.klassifikation;
            newProduct.alkoholgehalt = productFromOrderItem.alkoholgehalt;
            newProduct.ausbau = productFromOrderItem.ausbau;
            newProduct.biologisch = productFromOrderItem.biologisch;
            newProduct.trinkfensterVon = productFromOrderItem.trinkfensterVon;
            newProduct.trinkfensterBis = productFromOrderItem.trinkfensterBis;
            console.log("getOrCreateProduct: created:", newProduct);
            products.push(newProduct);
            return newProduct;
        }
    }

    private async moveProcessedOrders(unprocessedOrders: Order[]) {
        unprocessedOrders.forEach(order => this.moveProcessedOrder(order));
    }

    private async moveProcessedOrder(unprocessedOrder: Order) {
        console.log("moveProcessedOrder: moving order:", unprocessedOrder.getSourceDocumentUrl());
        await this.orderRespository.saveProcessedOrder(unprocessedOrder.clone())

        // Delete from source
        if (unprocessedOrder.getSourceDocumentUrl()) {
            await deleteSolidDataset(unprocessedOrder.getSourceDocumentUrl() as string, { fetch: fetch });
        }
     }

    private explode(orderItem: OrderItem): OrderItem[] {
        const orderItems = new Array()
        if (orderItem.orderQuantity) {
            for (let i = 0; i < orderItem.orderQuantity; i++) {
                orderItems.push(orderItem);
            }
        }
        return orderItems;
    }

}