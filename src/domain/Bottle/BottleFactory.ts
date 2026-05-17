import type {Product} from "../Product/Product.ts";
import type {Bottle} from "./Bottle.ts";

export interface BottleFactory {

    createFromProduct(product: Product): Bottle;

}