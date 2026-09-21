import type {BelongsToManyRelation, BelongsToOneRelation, HasManyRelation} from "soukai-bis";
import Model from "./SoukaiProduct.schema";
import type { Product } from "../../../domain/Product/Product";
import type {Rating} from "../../../domain/Product/Rating.ts";
import type {SoukaiBottle} from "./SoukaiBottle.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import {SoukaiRating} from "./SoukaiRating.ts";

export class SoukaiProduct extends Model implements Product {

    // Relation wiring lives in SoukaiProduct.schema.ts.
    declare public orderItem: SoukaiOrderItem;
    declare public relatedOrderItem: BelongsToOneRelation<this, SoukaiOrderItem, typeof SoukaiOrderItem>;

    declare public ratings: SoukaiRating[];
    declare public relatedRatings: BelongsToManyRelation<this, SoukaiRating, typeof SoukaiRating>;

    // Inverse relation to the bottles of this product (see SoukaiProduct.schema.ts).
    declare public bottles: SoukaiBottle[];
    declare public relatedBottles: HasManyRelation<this, SoukaiBottle, typeof SoukaiBottle>;

    getId(): string {
        return this.url as string;
    }
    getName(): string {
        return this.orUndefined(this.name);
    }
    getWineName(): string {
        return this.orUndefined(this.weinname);
    }
    getProductionDate(): Date | undefined {
        return this.productionDate ? this.productionDate : undefined;
    }
    getPrice(): number {
        return this.orUndefined(this.price);
    }
    getPriceCurrency(): string {
        return this.orUndefined(this.priceCurrency);
    }
    getProducer(): string {
        return this.orUndefined(this.hersteller);
    }
    getCountry(): string {
        return this.orUndefined(this.land);
    }
    getVolumeMl(): number {
        return this.orUndefined(this.milliliter);
    }
    getRegion(): string {
        return this.orUndefined(this.region);
    }
    getGrapeVariety(): string {
        return this.orUndefined(this.traubensorte);
    }
    getWineType(): string {
        return this.orUndefined(this.weinart);
    }
    getWineColor(): string {
        return this.orUndefined(this.weinfarbe);
    }
    getAlcoholContent(): string {
        return this.orUndefined(this.alkoholgehalt);
    }
    getProduction(): string {
        return this.orUndefined(this.ausbau);
    }
    getOrganic(): string {
        return this.orUndefined(this.biologisch);
    }
    getClassification(): string {
        return this.orUndefined(this.klassifikation);
    }
    getDrinkingWindowFrom(): Date {
        return this.orUndefined(this.trinkfensterVon);
    }
    getDrinkingWindowTo(): Date {
        return this.orUndefined(this.trinkfensterBis);
    }
    getOrderItem(): SoukaiOrderItem {
        return this.orderItem;
    }
    getRatings(): Rating[] {
        // Aggregate the legacy product-level ratings with the ratings now stored
        // on this product's bottles. Both relations are loaded by the repository
        // before display; when unloaded, the magic getter yields undefined.
        const productRatings: Rating[] = this.ratings ?? [];
        const bottleRatings: Rating[] = (this.bottles ?? [])
            .map((bottle) => bottle.getRating())
            .filter((rating): rating is Rating => rating !== undefined);
        return [...productRatings, ...bottleRatings];
    }
    /**
     * @deprecated Ratings are now stored per bottle via SoukaiBottle.setRating().
     * Retained so existing product-level rating arrays remain writable; new code
     * SHOULD NOT add ratings to the product.
     */
    createRating(value: number): SoukaiRating {
        const rating: SoukaiRating = new SoukaiRating();
        rating.value = value;
        rating.date = new Date();
        // Attach through the relation so the rating is embedded in the product
        // document on save (a plain array push does not register it with bis).
        this.relatedRatings.addRelated(rating);
        return rating;
    }

    // setters — inline editing writes through to the mapped schema fields;
    // persistence happens via KellermeisterService.updateProduct.
    setName(name: string): void {
        this.name = name;
    }
    setProducer(producer: string): void {
        this.hersteller = producer;
    }
    setWineName(wineName: string): void {
        this.weinname = wineName;
    }
    setProductionDate(date: Date | undefined): void {
        this.productionDate = date;
    }
    setPrice(price: number): void {
        this.price = price;
    }
    setVolumeMl(volumeMl: number): void {
        this.milliliter = volumeMl;
    }
    setRegion(region: string): void {
        this.region = region;
    }
    setCountry(country: string): void {
        this.land = country;
    }
    setGrapeVariety(grapeVariety: string): void {
        this.traubensorte = grapeVariety;
    }
    setWineType(wineType: string): void {
        this.weinart = wineType;
    }
    setWineColor(wineColor: string): void {
        this.weinfarbe = wineColor;
    }
    setAlcoholContent(alcoholContent: string): void {
        this.alkoholgehalt = alcoholContent;
    }
    setProduction(production: string): void {
        this.ausbau = production;
    }
    setOrganic(organic: string): void {
        this.biologisch = organic;
    }
    setClassification(classification: string): void {
        this.klassifikation = classification;
    }
    setDrinkingWindowFrom(date: Date | undefined): void {
        this.trinkfensterVon = date;
    }
    setDrinkingWindowTo(date: Date | undefined): void {
        this.trinkfensterBis = date;
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
