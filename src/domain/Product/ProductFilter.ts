import {Weinart} from "./Weinart.ts";
import {Weinfarbe} from "./Weinfarbe.ts";
import {Product} from "../Product/Product.ts";

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

    public hasRestrictions(): boolean {
        return (this.isSprudel || this.isDessert || this.isWhite || this.isRed || this.isRose || this.isText);
    }

    public filterProduct(product: Product): boolean {
        let result: boolean = true;
        // Weinart
        if (this.isSprudel) {
            result = result && Weinart.Schaumwein.equals(product.weinart);
        }
        if (this.isDessert) {
            result = result && Weinart.Dessertwein.equals(product.weinart);
        }
        // Weinfarbe
        if (this.isWhite) {
            result = result && Weinfarbe.Weiss.equals(product.weinfarbe);
        }
        if (this.isRed) {
            result = result && Weinfarbe.Rot.equals(product.weinfarbe);
        }
        if (this.isRose) {
            result = result && Weinfarbe.Rose.equals(product.weinfarbe);
        }
        // Text
        if (this.isText) {
            if (this.textFilter) {
                result = result && (
                    product.name?.toLowerCase().includes(this.textFilter.toLowerCase())
                    || product.productionDate?.toUTCString().toLowerCase().includes(this.textFilter.toLowerCase())
                    || product.traubensorte?.toLowerCase().includes(this.textFilter.toLowerCase())
                    || product.alkoholgehalt?.includes(this.textFilter)
                    || product.land?.toLowerCase().includes(this.textFilter.toLowerCase())
                    || product.region?.toLowerCase().includes(this.textFilter.toLowerCase())
                    || product.trinkfensterBis === undefined ? true : product.trinkfensterBis.getFullYear() <= Number(this.textFilter)
                );
            }
        }
        return result;
    }

}