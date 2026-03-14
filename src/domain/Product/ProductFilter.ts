import {Weinart} from "./Weinart.ts";
import {Weinfarbe} from "./Weinfarbe.ts";
import {Bottle} from "../Bottle/Bottle.ts";

export class ProductFilter {

    // Weinart
    public isSprudel: boolean = false;
    public isDessert: boolean = false;

    // Weinfarbe
    public isWhite: boolean = false;
    public isRed: boolean = false;
    public isRose: boolean = false;

    public isText: boolean = false;
    public textFilter: String | null = null;

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

    public filterBottle(bottle: Bottle): boolean {
        let result: boolean = true;
        // Weinart
        if (this.isSprudel) {
            result = result && Weinart.Schaumwein.equals(bottle.product.weinart);
        }
        if (this.isDessert) {
            result = result && Weinart.Dessertwein.equals(bottle.product.weinart);
        }
        // Weinfarbe
        if (this.isWhite) {
            result = result && Weinfarbe.Weiss.equals(bottle.product.weinfarbe);
        }
        if (this.isRed) {
            result = result && Weinfarbe.Rot.equals(bottle.product.weinfarbe);
        }
        if (this.isRose) {
            result = result && Weinfarbe.Rose.equals(bottle.product.weinfarbe);
        }
        // Text
        if (this.isText) {
            result = result && (
                bottle.product.name.toLowerCase().includes(this.textFilter.toLowerCase())
                || bottle.product.productionDate?.toUTCString().toLowerCase().includes(this.textFilter.toLowerCase())
                || bottle.product.traubensorte?.toLowerCase().includes(this.textFilter.toLowerCase())
                || bottle.product.alkoholgehalt?.includes(this.textFilter)
                || bottle.product.land?.toLowerCase().includes(this.textFilter.toLowerCase())
                || bottle.product.region?.toLowerCase().includes(this.textFilter.toLowerCase())
                || bottle.product.trinkfensterBis.getFullYear() <= Number(this.textFilter)
            );
        }
        return result;
    }

}