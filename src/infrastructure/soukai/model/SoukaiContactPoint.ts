import Model from "./SoukaiContactPoint.schema";

export class SoukaiContactPoint extends Model {
    static timestamps = false;

    getName(): string | undefined {
        return this.orUndefined(this.name);
    }
    getEmail(): string | undefined {
        return this.orUndefined(this.email);
    }

    private orUndefined(value: any): any | undefined {
        return value ? value : undefined;
    }
}
