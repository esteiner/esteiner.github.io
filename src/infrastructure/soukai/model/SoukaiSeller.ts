import {SolidModel} from "soukai-solid";
import {FieldType} from "soukai";
import type {Seller} from "../../../domain/Order/Seller.ts";


export class SoukaiSeller extends SolidModel implements Seller {
    static timestamps = false;
    static rdfContexts = { schema: "https://schema.org/" };
    static rdfsClasses = ["schema:Organization"];
    static fields = {
        name: { type: FieldType.String, rdfProperty: "schema:name" },
        email: { type: FieldType.String, rdfProperty: "schema:email" },
    };
    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.getAttribute("name");
    }
    getEmail(): string {
        return this.getAttribute("email");
    }
}