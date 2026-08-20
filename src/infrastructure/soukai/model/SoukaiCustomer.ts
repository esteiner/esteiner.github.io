import type {Relation} from "soukai";
import type {SolidBelongsToOneRelation} from "soukai-solid";
import Model from "./SoukaiCustomer.schema";
import type {Customer} from "../../../domain/Order/Customer.ts";
import {SoukaiContactPoint} from "./SoukaiContactPoint.ts";


export class SoukaiCustomer extends Model implements Customer {
    static timestamps = false;

    declare public contactPoint: SoukaiContactPoint | undefined;
    declare public relatedContactPoint: SolidBelongsToOneRelation<SoukaiCustomer, SoukaiContactPoint, typeof SoukaiContactPoint>;
    // The customer's name/email live on the nested schema:ContactPoint (same
    // document), not directly on the Organization node — see getName/getEmail.
    public contactPointRelationship(): Relation {
        return this
            .belongsToOne(SoukaiContactPoint, "contactPointUrl")
            .usingSameDocument(true);
    }

    getId(): string {
        return super.getIdAttribute();
    }
    getName(): string {
        // Prefer the contactPoint's name, falling back to the organization's own.
        return this.orUndefined(this.contactPoint?.getName() ?? this.name);
    }
    getEmail(): string {
        // Prefer the contactPoint's email; the Organization node usually has none.
        return this.orUndefined(this.contactPoint?.getEmail() ?? this.email);
    }
    getAddress(): string {
        return this.orUndefined(this.address);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
