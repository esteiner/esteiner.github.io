import type {Product} from "../../../domain/Product/Product.ts";
import type {OrderItem} from "../../../domain/Order/OrderItem.ts";
import type {ProductFactory} from "../../../domain/Product/ProductFactory.ts";
import {SoukaiProduct} from "./SoukaiProduct.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";

export class SoukaiProductFactory implements ProductFactory  {

    public createProduct(product: Product, orderItem: OrderItem): Product {
        const newProduct: SoukaiProduct = new SoukaiProduct();
        newProduct.name = product.getName();
        newProduct.productionDate = product.getProductionDate();
        newProduct.hersteller = product.getProducer();
        newProduct.weinart = product.getWineType();
        newProduct.weinfarbe = product.getWineColor();
        newProduct.milliliter = product.getVolumeMl();
        newProduct.region = product.getRegion();
        newProduct.land = product.getCountry();
        newProduct.traubensorte = product.getGrapeVariety();
        newProduct.klassifikation = product.getClassification();
        newProduct.alkoholgehalt = product.getAlcoholContent();
        newProduct.ausbau = product.getProduction();
        newProduct.biologisch = product.getOrganic();
        newProduct.trinkfensterVon = product.getDrinkingWindowFrom();
        newProduct.trinkfensterBis = product.getDrinkingWindowTo();
        if (orderItem instanceof SoukaiOrderItem) {
            newProduct.relatedOrderItem.addRelated(orderItem);
        }
        newProduct.price = orderItem.getPrice();
        newProduct.priceCurrency = orderItem.getPriceCurrency();
        console.log("createProduct: created:", newProduct);
        return newProduct;
    }

}