import {SolidModel} from "soukai-solid";
import {FieldType} from "soukai";
import type {Cellar} from "../../../domain/Cellar/Cellar.ts";


export class SoukaiCellar extends SolidModel implements Cellar {
    static timestamps = false;
    static rdfContexts = { schema: "https://schema.org/" };
    static rdfsClasses = ["schema:Room"];
    static fields = {
        name: { type: FieldType.String, rdfProperty: "schema:name" },
        displayOrder: { type: FieldType.Number, rdfProperty: "km:displayOrder" },
    };
    getId(): string {
        return this.url;
    }
    getName(): string {
        return this.getAttribute("name");
    }
    getDisplayOrder(): number {
        return this.getAttribute("displayOrder");
    }
}