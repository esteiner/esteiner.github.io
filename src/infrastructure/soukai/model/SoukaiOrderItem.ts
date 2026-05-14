import {FieldType, type Relation} from "soukai";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import {type SolidBelongsToOneRelation, SolidModel} from "soukai-solid";
import {SoukaiOrder} from "./SoukaiOrder.ts";

export class SoukaiOrderItem extends SolidModel implements OrderItem {
  static timestamps = false;
  static rdfContexts = {
    schema: "https://schema.org/",
    wine: "https://vocab.kellermeister.ch/wine/",
  };
  static rdfsClasses = ["schema:OrderItem"];
  static fields = {
    price: { type: FieldType.Number, rdfProperty: "schema:price" },
    priceCurrency: { type: FieldType.String, rdfProperty: "schema:priceCurrency" },
    orderQuantity: { type: FieldType.Number, rdfProperty: "schema:orderQuantity" },
    orderUrl: { type: FieldType.Key, rdfProperty: "wine:order" },
  };

  declare public order: SoukaiOrder;
  declare public relatedOrder: SolidBelongsToOneRelation<SoukaiOrderItem, SoukaiOrder, typeof SoukaiOrder>;
  public orderRelationship() : Relation {
    return this
        .belongsToOne(SoukaiOrder, 'orderUrl')
        .usingSameDocument(true);
  }

  // declare public product: ProductModel;
  // public productRelationship() : Relation {
  //   return this
  //       .belongsToOne(ProductModel, 'productUrl')
  //       .usingSameDocument(true);
  // }

  getId(): string {
    return super.getIdAttribute();
  }
  getPrice(): number {
    return this.getAttribute("price");
  }
  getPriceCurrency(): string {
    return this.getAttribute("priceCurrency");
  }
  getOrderQuantity(): number {
    return this.getAttribute("orderQuantity");
  }
  getOrder(): SoukaiOrder {
    return this.order;
  }
}