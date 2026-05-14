import {SolidModel} from "soukai-solid";
import type {BottlesStorage} from "../../../domain/Bottle/BottlesStorage.ts";
import {FieldType, type Relation} from "soukai";
import {SoukaiBottle} from "./SoukaiBottle.ts";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";

export class SoukaiBottlesStorage extends SolidModel implements BottlesStorage {
    static timestamps = false;
    static rdfContexts = { schema: "https://schema.org/" };
    static rdfsClasses = ["schema:Collection"];
    static fields = {
        bottleUrls: { type: FieldType.Array, items: { type: FieldType.Key }, rdfProperty: "schema:hasPart" },
    };

    declare public bottles: SoukaiBottle[];
    public bottlesRelationship(): Relation {
        return this
            .belongsToMany(SoukaiBottle, "bottleUrls")
            .onDelete("cascade")
            .usingSameDocument(true);
    }

    getId(): string {
        return this.url;
    }
    getBottles(): SoukaiBottle[] {
        return this.bottles;
    }

    rateBottle(bottleId: string, rating: number) {
        this.bottles.filter(bottle => bottle.getId() === bottleId).forEach(bottle => bottle.setRating(rating));
    }

    isModified() {
        return this.isDirty();
    }

    transferBottle(transferedBottle: Bottle, cellarId: string) {
        this.bottles.filter(bottle => bottle.getId() === transferedBottle.getId()).forEach(bottle => bottle.setCellar(cellarId));
    }
}