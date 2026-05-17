import Model from "./SoukaiCellar.schema";
import type {Cellar} from "../../../domain/Cellar/Cellar.ts";


export class SoukaiCellar extends Model implements Cellar {
    static timestamps = false;

    getId(): string {
        return this.url;
    }
    getName(): string {
        return this.orUndefined(this.name);
    }
    getDisplayOrder(): number {
        return this.orUndefined(this.displayOrder);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}