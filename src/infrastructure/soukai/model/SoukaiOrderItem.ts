import type {BelongsToOneRelation} from "soukai-bis";
import Model from "./SoukaiOrderItem.schema";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import {SoukaiOrder} from "./SoukaiOrder.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiOrderItem extends Model implements OrderItem {

  // Relation wiring lives in SoukaiOrderItem.schema.ts.
  declare public order: SoukaiOrder;
  declare public relatedOrder: BelongsToOneRelation<this, SoukaiOrder, typeof SoukaiOrder>;

  declare public product: SoukaiProduct;
  declare public relatedProduct: BelongsToOneRelation<this, SoukaiProduct, typeof SoukaiProduct>;

  getId(): string {
    return this.url as string;
  }
  getPrice(): number {
    return this.orUndefined(this.price);
  }
  getPriceCurrency(): string {
    return this.orUndefined(this.priceCurrency);
  }
  getOrderQuantity(): number {
    return this.orUndefined(this.orderQuantity);
  }
  getOrder(): SoukaiOrder {
    return this.order;
  }
  getProduct(): SoukaiProduct {
    return this.product;
}

  private orUndefined(value: any): any | undefined {
    return value ? value : undefined;
  }

}
