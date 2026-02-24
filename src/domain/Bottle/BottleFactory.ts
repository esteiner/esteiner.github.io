import {Bottle} from "./Bottle.ts";
import {Product} from "../Product/Product.ts";
import type {OrderItem} from "../Order/OrderItem.ts";

export class BottleFactory {

    public createFromOrderItem(product: Product, orderItem: OrderItem): Bottle {
        const bottle = this.createFromProduct(product);
        bottle.price = orderItem.price;
        bottle.priceCurrency = orderItem.priceCurrency;
        bottle.orderItemId = orderItem?.id;
        return bottle;
    }

    public createFromProduct(product: Product): Bottle {
        const bottle = new Bottle();
        bottle.relatedProduct.addRelated(product);
        const relation = bottle.getRelation('product');
        console.log("createFromProduct: relation", relation);
        console.log("createFromProduct: bottle.product", bottle.product);
        return bottle;
    }

}