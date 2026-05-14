import {SolidModel} from "soukai-solid";
import {FieldType} from "soukai";
import type {SellerModel} from "../../../domain/Order/SellerModel.ts";


export class SoukaiSeller extends SolidModel implements SellerModel {
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