import type {BelongsToOneRelation} from "soukai-bis";
import Model from "./SoukaiCustomer.schema";
import type {Customer} from "../../../domain/Order/Customer.ts";
import {SoukaiContactPoint} from "./SoukaiContactPoint.ts";


export class SoukaiCustomer extends Model implements Customer {

    // Relation wiring lives in SoukaiCustomer.schema.ts. The customer's name/email
    // live on the nested schema:ContactPoint (same document), not directly on the
    // Organization node — see getName/getEmail.
    declare public contactPoint: SoukaiContactPoint | undefined;
    declare public relatedContactPoint: BelongsToOneRelation<this, SoukaiContactPoint, typeof SoukaiContactPoint>;

    getId(): string {
        return this.url as string;
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
