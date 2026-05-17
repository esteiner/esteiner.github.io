import {SolidModel} from "soukai-solid";
import type {BottlesDocument} from "../../../domain/Bottle/BottlesDocument.ts";
import {FieldType, type Relation} from "soukai";
import {SoukaiBottle} from "./SoukaiBottle.ts";
import type {Bottle} from "../../../domain/Bottle/Bottle.ts";

/**
 * This class represents the bottles.ttl resource/document containing all bottles.
 */
export class SoukaiBottlesDocument extends SolidModel implements BottlesDocument {
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
    addBottle(bottle: Bottle): void {
        if (bottle instanceof SoukaiBottle) {
            this.bottles.push(bottle as SoukaiBottle);
        }
    }

    isDirty2() {
        console.log("isDirty2: ", super.isDirty());
        return this.isDirty();
    }
    save(): Promise<this> {
        return super.save();
    }

}