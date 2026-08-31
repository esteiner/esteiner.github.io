import Model from "./SoukaiSeller.schema";
import type {Seller} from "../../../domain/Order/Seller.ts";


export class SoukaiSeller extends Model implements Seller {

    getId(): string {
        return this.url as string;
    }
    getName(): string {
        return this.orUndefined(this.name);
    }
    getEmail(): string {
        return this.orUndefined(this.email);
    }
    getUrl(): string {
        return this.orUndefined(this.homepage);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
