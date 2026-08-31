import Model from "./SoukaiRating.schema";
import type {Rating} from "../../../domain/Product/Rating.ts";

export class SoukaiRating extends Model implements Rating {

    getId(): string {
        return this.url as string;
    }
    getValue(): number {
        return this.orUndefined(this.value);
    }
    getDate(): Date {
        return this.orUndefined(this.date);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
