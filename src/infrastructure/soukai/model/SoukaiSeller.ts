import Model from "./SoukaiSeller.schema";
import type {Seller} from "../../../domain/Order/Seller.ts";


export class SoukaiSeller extends Model implements Seller {
    static timestamps = false;

    getId(): string {
        return super.getIdAttribute();
    }
    getName(): string {
        return this.orUndefined(this.name);
    }
    getEmail(): string {
        return this.orUndefined(this.email);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}