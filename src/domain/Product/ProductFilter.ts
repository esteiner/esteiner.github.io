import {Weinart} from "./Weinart.ts";
import {Weinfarbe} from "./Weinfarbe.ts";
import type {Product} from "./Product.ts";

export class ProductFilter {

    // Weinart
    public isSprudel: boolean = false;
    public isDessert: boolean = false;

    // Weinfarbe
    public isWhite: boolean = false;
    public isRed: boolean = false;
    public isRose: boolean = false;

    public isText: boolean = false;
    public textFilter: string | null = null;

    public toggleSprudelFilter(): void {
        this.isSprudel = !this.isSprudel;
    }

    public toggleDessertFilter(): void {
        this.isDessert = !this.isDessert;
    }

    public toggleWhiteFilter(): void {
        this.isWhite = !this.isWhite;
    }

    public toggleRedFilter(): void {
        this.isRed = !this.isRed;
    }

    public toggleRoseFilter(): void {
        this.isRose = !this.isRose;
    }

    public toggleTextFilter(): void {
        this.isText = !this.isText;
    }

    public toSearchParams(): URLSearchParams {
        const params = new URLSearchParams();
        if (this.isSprudel) params.set('sprudel', '1');
        if (this.isDessert) params.set('dessert', '1');
        if (this.isWhite) params.set('weiss', '1');
        if (this.isRed) params.set('rot', '1');
        if (this.isRose) params.set('rose', '1');
        if (this.isText && this.textFilter) params.set('text', this.textFilter);
        return params;
    }

    public static fromSearchParams(params: URLSearchParams): ProductFilter {
        const filter = new ProductFilter();
        filter.isSprudel = params.has('sprudel');
        filter.isDessert = params.has('dessert');
        filter.isWhite = params.has('weiss');
        filter.isRed = params.has('rot');
        filter.isRose = params.has('rose');
        const text = params.get('text');
        if (text) {
            filter.isText = true;
            filter.textFilter = text;
        }
        return filter;
    }

    public hasRestrictions(): boolean {
        return (this.isSprudel || this.isDessert || this.isWhite || this.isRed || this.isRose || this.isText);
    }

    public filterProduct(product: Product): boolean {
        let result: boolean = true;
        // Weinart
        if (this.isSprudel) {
            result = result && Weinart.Schaumwein.equals(product.getWineType());
        }
        if (this.isDessert) {
            result = result && Weinart.Dessertwein.equals(product.getWineType());
        }
        // Weinfarbe — without a Weinart filter, a colour selects the still wine of that colour
        const isWeinartFilter = this.isSprudel || this.isDessert;
        if (this.isWhite) {
            result = result && Weinfarbe.Weiss.equals(product.getWineColor());
            if (!isWeinartFilter) {
                result = result && Weinart.Weisswein.equals(product.getWineType());
            }
        }
        if (this.isRed) {
            result = result && Weinfarbe.Rot.equals(product.getWineColor());
            if (!isWeinartFilter) {
                result = result && Weinart.Rotwein.equals(product.getWineType());
            }
        }
        if (this.isRose) {
            result = result && Weinfarbe.Rose.equals(product.getWineColor());
            if (!isWeinartFilter) {
                result = result && Weinart.Rosewein.equals(product.getWineType());
            }
        }
        // Text
        if (this.isText) {
            if (this.textFilter) {
                const drinkingWindowYear = ProductFilter.parseDrinkingWindowYear(this.textFilter);
                if (drinkingWindowYear !== null) {
                    result = result && this.endsDrinkingWindowBy(drinkingWindowYear, product.getDrinkingWindowTo()?.getFullYear());
                } else {
                    const textFilterLowerCase = this.textFilter.toLowerCase();
                    result = result && (
                        this.isIncludedIn(textFilterLowerCase, product.getName()?.toLowerCase())
                        || this.isIncludedIn(textFilterLowerCase, product.getProductionDate()?.toUTCString().toLowerCase())
                        || this.isIncludedIn(textFilterLowerCase, product.getGrapeVariety()?.toLowerCase())
                        || this.isIncludedIn(textFilterLowerCase, product.getAlcoholContent())
                        || this.isIncludedIn(textFilterLowerCase, product.getCountry()?.toLowerCase())
                        || this.isIncludedIn(textFilterLowerCase, product.getRegion()?.toLowerCase())
                    );
                }
            }
        }
        return result;
    }

    private isIncludedIn(filter: string, value: string | undefined): boolean {
        if (value === undefined) {
            return false;
        }
        const result = value.includes(filter);
        return result;
    }

    // Parses "bis <year>" (e.g. "bis 2025") and returns the year, or null for any other text.
    private static parseDrinkingWindowYear(text: string): number | null {
        const match = /^bis\s*(\d{4})$/i.exec(text.trim());
        return match ? Number(match[1]) : null;
    }

    private endsDrinkingWindowBy(year: number, drinkingWindowToYear: number | undefined): boolean {
        if (drinkingWindowToYear === undefined) {
            return false;
        }
        return drinkingWindowToYear <= year;
    }

}