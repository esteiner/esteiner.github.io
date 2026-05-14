import {SolidBottle} from "./SolidBottle.ts";
import {SolidProduct} from "../Product/SolidProduct.ts";
import type {SolidOrderItem} from "../Order/SolidOrderItem.ts";

export class BottleFactory {

    public createFromOrderItem(product: SolidProduct, orderItem: SolidOrderItem): SolidBottle {
        const bottle = this.createFromProduct(product);
        bottle.orderItemId = orderItem?.id;
        return bottle;
    }

    public createFromProduct(product: SolidProduct): SolidBottle {
        const bottle = new SolidBottle();
        bottle.relatedProduct.addRelated(product);
        const relation = bottle.getRelation('product');
        console.log("createFromProduct: relation", relation);
        console.log("createFromProduct: bottle.product", bottle.product);
        return bottle;
    }

}