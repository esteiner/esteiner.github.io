import Model from "./schemas/BottlesContainer.schema.ts";
import type {Relation} from "soukai";
import {SolidBottle} from "./SolidBottle.ts";
import type {SolidProduct} from "../Product/SolidProduct.ts";

export class BottlesContainer extends Model {
    static rdfsClasses = ['https://schema.org/Collection'];
    static history = false;

    declare public bottles: SolidBottle[];

    public bottlesRelationship() : Relation {
        return this
            .belongsToMany(SolidBottle, 'bottlesUrl')
            .onDelete('cascade')
            .usingSameDocument(true);
    }

    public addBottle(bottle: SolidBottle): SolidBottle {
        this.bottles.push(bottle);
        return bottle;
    }

    public transferBottle(transferedBottle: SolidBottle, cellarId: string) {
        this.bottles.filter(bottle => bottle.id === transferedBottle.id).forEach(bottle => bottle.cellar = cellarId);
    }

    public rateBottle(ratedBottle: SolidBottle, rating: number) {
        this.bottles.filter(bottle => bottle.id === ratedBottle.id).forEach(bottle => bottle.rating = rating);
    }

    // ToDo: delete
    public products(): SolidProduct[] {
        //console.log("products: bottles:", this.bottles);
        return Array.from(this.bottles.map(bottle => bottle.product).values());
    }

}