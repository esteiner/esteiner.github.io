import type {BottlesDocumentRepository} from "../../domain/Bottle/BottlesDocumentRepository.ts";
import type {BottlesDocument} from "../../domain/Bottle/BottlesDocument.ts";
import {bootModels, type EngineDocument, requireEngine} from "soukai";
import {SoukaiSeller} from "./model/SoukaiSeller.ts";
import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiBottle} from "./model/SoukaiBottle.ts";
import {SoukaiBottlesStorage} from "./model/SoukaiBottlesStorage.ts";
import {urlRoute} from "@noeldemartin/utils";
import type {SolidModel} from "soukai-solid";

const SCHEMA_ORGANIZATION = "https://schema.org/Organization"; // seller
const SCHEMA_ORDER = "https://schema.org/Order";
const SCHEMA_ORDER_ITEM = "https://schema.org/OrderItem";
const SCHEMA_PRODUCT = "https://schema.org/Product";
const SCHEMA_LIST_ITEM = "https://schema.org/ListItem"; // bottle
const SCHEMA_COLLECTION = "https://schema.org/Collection"; // bottles

export class SoukaiBottlesStorageRepository implements BottlesDocumentRepository {

    private bottlesUrl: string;
    private bottlesDocumentUrl: string;

    constructor(storageUrl: URL) {
        this.bottlesUrl = storageUrl.toString() + 'private/kellermeister/bottles/bottles#it';
        this.bottlesDocumentUrl = urlRoute(this.bottlesUrl);
        bootModels({ SoukaiSeller, SoukaiOrder, SoukaiOrderItem, SoukaiProduct, SoukaiBottle, SoukaiBottlesStorage });
    }

    /**
     * Fetches the BottleStorage.
     */
    async fetchBottlesStorage(): Promise<SoukaiBottlesStorage | undefined> {
        try {
            console.log(`fetchBottlesContainer: from bottlesUrl`, this.bottlesUrl);
            console.log(`fetchBottlesContainer: from urlRoute(bottlesUrl)`, this.bottlesDocumentUrl);
            const start = performance.now();
            const document = await requireEngine().readOne(this.bottlesUrl, this.bottlesUrl);
            const bottlesStorage = await this.deserializeDocument(document);
            const end = performance.now();
            console.log("fetchBottlesContainer: ", bottlesStorage?.getBottles()?.length, "bottles found in", this.asSeconds(end - start), "seconds");
            return bottlesStorage;
        } catch (error) {
            console.log(error);
        }
    }

    async save(bottlesStorage: BottlesDocument): Promise<BottlesDocument | undefined> {
        const soukaiBottlesStorage = bottlesStorage as SoukaiBottlesStorage;
        soukaiBottlesStorage.url = this.bottlesUrl;
        console.log("save: is modified", soukaiBottlesStorage.isDirty());
        await soukaiBottlesStorage.save();
        return await this.fetchBottlesStorage();
    }

    private async deserializeDocument(document: EngineDocument): Promise<SoukaiBottlesStorage | undefined> {
        try {
            const entries = (document as any)["@graph"] as any[];
            console.log("deserializeDocument: with entries", entries.length);

            // 0. Build BottlesDocument
            const bottlesStorage: SoukaiBottlesStorage | undefined = await this.deserializeBottlesStorage(entries);

            if (bottlesStorage) {
                // 1. Build Seller lookup
                const sellerMap = new Map<string, SoukaiSeller>();
                await this.deserializeSellerInto(entries, sellerMap);

                // 2. Build Order lookup
                const orderMap = new Map<string, SoukaiOrder>();
                await this.deserializeOrdersInto(entries, orderMap, sellerMap);

                // 3. Build OrderItem lookup
                const orderItemMap = new Map<string, SoukaiOrderItem>();
                await this.deserializeOrderItemsInto(entries, orderItemMap, orderMap);

                // 4. Build Product lookup
                const productMap = new Map<string, SoukaiProduct>();
                await this.deserializeProductsInto(entries, productMap, orderItemMap);

                // 5. Build Bottles from ListItems via BottleModel
                const soukaiBottles: SoukaiBottle[] = await this.deserializeBottles(entries, productMap);

                bottlesStorage.setRelationModels("bottles", soukaiBottles);
                const documentModels = bottlesStorage.getDocumentModels();
                bottlesStorage.cleanDirty();
                console.log("documentModels: ", documentModels);
            }

            return bottlesStorage;
        } catch (error) {
            console.log("deserializeDocument: error", error);
        }
    }

    // 0. BottlesStorage
    private async deserializeBottlesStorage(entries: any) {
        for (const entry of entries) {
            if (!this.hasType(entry, SCHEMA_COLLECTION)) continue;
            const bottlesStorage = await SoukaiBottlesStorage.newFromJsonLD(entry, this.bottlesUrl);
            bottlesStorage.url = this.bottlesUrl;
            return bottlesStorage;
        }
    }

    // 1. Seller
    private async deserializeSellerInto(entries: any, sellerMap: Map<string, SoukaiSeller>) {
        for (const entry of entries) {
            if (!this.hasType(entry, SCHEMA_ORGANIZATION)) continue;
            const seller = await SoukaiSeller.newFromJsonLD(entry, this.bottlesDocumentUrl);
            this.setId(seller, entry);
            console.log("deserializeSellerInto: getDocumentUrl()", seller.getDocumentUrl());
            console.log("deserializeSellerInto: getSourceDocumentUrl()", seller.getSourceDocumentUrl());
            seller.cleanDirty();
            sellerMap.set(entry["@id"], seller);
            //console.log("deserializeDocument: seller found", seller);
        }
    }

    // 2. Order
    private async deserializeOrdersInto(entries: any, orderMap: Map<string, SoukaiOrder>, sellerMap: Map<string, SoukaiSeller>) {
        for (const entry of entries) {
            if (!this.hasType(entry, SCHEMA_ORDER)) continue;
            const order = await SoukaiOrder.newFromJsonLD(entry, this.bottlesUrl);
            this.setId(order, entry);
            const a = order.getAttributes();
            const seller = a.sellerUrl
                ? sellerMap.get(a.sellerUrl as string)
                : undefined;
            if (!seller) continue;
            order.seller = seller;
            order.cleanDirty();
            orderMap.set(entry["@id"], order);
            //console.log("deserializeOrdersInto: order found", order);
        }
    }

    // 3. OrderItem
    private async deserializeOrderItemsInto(entries: any, orderItemMap: Map<string, SoukaiOrderItem>, orderMap: Map<string, SoukaiOrder>) {
        for (const entry of entries) {
            if (!this.hasType(entry, SCHEMA_ORDER_ITEM)) continue;
            const orderItem = await SoukaiOrderItem.newFromJsonLD(entry, this.bottlesUrl);
            this.setId(orderItem, entry);
            const a = orderItem.getAttributes();
            const order = a.orderUrl ?
                orderMap.get(a.orderUrl as string)
                : undefined;
            if (!order) continue;
            orderItem.order = order;
            orderItem.cleanDirty();
            orderItemMap.set(entry["@id"], orderItem);
            //console.log("deserializeOrderItemsInto: orderItem found", orderItem);
        }
    }

    // 4. Product
    private async deserializeProductsInto(entries: any, productMap: Map<string, SoukaiProduct>, orderItemMap: Map<string, SoukaiOrderItem>) {
        for (const entry of entries) {
            if (!this.hasType(entry, SCHEMA_PRODUCT)) continue;
            const product = await SoukaiProduct.newFromJsonLD(entry, this.bottlesUrl);
            this.setId(product, entry);
            // console.log("deserializeProductsInto: product.id", product.getId());
            const a = product.getAttributes();
            const orderItem = a.orderItemUrl ?
                orderItemMap.get(a.orderItemUrl as string)
                : undefined;
            if (!orderItem) continue;
            product.orderItem = orderItem;
            product.cleanDirty();
            productMap.set(entry["@id"], product);
            //console.log("deserializeProductsInto: product found", product);
        }
    }

    // 5. Bottles
    private async deserializeBottles(entries: any, productMap: Map<string, SoukaiProduct>): Promise<SoukaiBottle[]> {
        const bottles: SoukaiBottle[] = [];
        for (const entry of entries) {
            if (!this.hasType(entry, SCHEMA_LIST_ITEM)) continue;
            const bottle = await SoukaiBottle.newFromJsonLD(entry, this.bottlesUrl);
            this.setId(bottle, entry);
            const a = bottle.getAttributes();
            const product = a.productUrl ?
                productMap.get(a.productUrl as string)
                : undefined;
            if (!product) continue;
            bottle.product = product;
            console.log("deserializeBottles: bottle.cellarUrl", bottle.cellarUrl);
            bottle.cleanDirty();
            bottles.push(bottle);
        }
        return bottles;
    }

    private setId(soukaiModel: SolidModel, entry: any): void {
        // @ts-ignore
        soukaiModel["@id"] = entry["@id"];
        soukaiModel.url = entry["@id"];
    }

    private hasType(entry: any, typeUri: string): boolean {
        //console.log("hasType: ", entry["@type"]);
        return (
            entry["@type"] === typeUri ||
            (Array.isArray(entry["@type"]) && entry["@type"].includes(typeUri))
        );
    }

    private asSeconds(milliSeconds: number): string {
        return (milliSeconds / 1000).toFixed(2)
    }
}