import Model from "./schemas/BottlesContainer.schema.ts";
import type {Relation} from "soukai";
import {Bottle} from "./Bottle.ts";
import type {Product} from "../Product/Product.ts";

export class BottlesContainer extends Model {
    static rdfsClasses = ['https://schema.org/Collection'];

    declare public bottles: Bottle[];

    public bottlesRelationship() : Relation {
        return this
            .belongsToMany(Bottle, 'bottlesUrl')
            .onDelete('cascade')
            .usingSameDocument(true);
    }

    public addBottle(bottle: Bottle): Bottle {
        this.bottles.push(bottle);
        return bottle;
    }

    public transferBottle(transferedBottle: Bottle, cellarId: string) {
        this.bottles.filter(bottle => bottle.id === transferedBottle.id).forEach(bottle => bottle.cellar = cellarId);
    }

    public products(): Product[] {
        console.log("products: bottles:", this.bottles);
        return Array.from(this.bottles.map(bottle => bottle.product).values());
    }

}