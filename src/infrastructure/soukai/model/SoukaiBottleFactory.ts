import type {BottleFactory} from "../../../domain/Bottle/BottleFactory.ts";
import type {Product} from "../../../domain/Product/Product.ts";
import {SoukaiBottle} from "./SoukaiBottle.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiBottleFactory implements BottleFactory {

    createFromProduct(product: Product): SoukaiBottle {
        const bottle: SoukaiBottle = new SoukaiBottle();
        if (product instanceof SoukaiProduct) {
            bottle.relatedProduct.setRelated(product as SoukaiProduct);
        }
        return bottle;
    }

}
