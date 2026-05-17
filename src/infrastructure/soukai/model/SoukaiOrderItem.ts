import type {Relation} from "soukai";
import {type SolidBelongsToOneRelation} from "soukai-solid";
import Model from "./SoukaiOrderItem.schema";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import {SoukaiOrder} from "./SoukaiOrder.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";

export class SoukaiOrderItem extends Model implements OrderItem {
  static timestamps = false;

  declare public order: SoukaiOrder;
  declare public relatedOrder: SolidBelongsToOneRelation<SoukaiOrderItem, SoukaiOrder, typeof SoukaiOrder>;
  public orderRelationship() : Relation {
    return this
        .belongsToOne(SoukaiOrder, 'orderUrl')
        .usingSameDocument(true);
  }

  declare public product: SoukaiProduct;
  declare public relatedProduct: SolidBelongsToOneRelation<SoukaiOrderItem, SoukaiProduct, typeof SoukaiProduct>;
  public productRelationship() : Relation {
    return this
        .belongsToOne(SoukaiProduct, 'productUrl')
        .usingSameDocument(true);
  }

  getId(): string {
    return super.getIdAttribute();
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