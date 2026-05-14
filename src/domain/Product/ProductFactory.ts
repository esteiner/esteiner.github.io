import {SolidProduct} from "./SolidProduct.ts";
import {SolidOrderItem} from "../Order/SolidOrderItem.ts";

export class ProductFactory {

    public createProduct(product: SolidProduct, orderItem: SolidOrderItem): SolidProduct {
        const newProduct: SolidProduct = new SolidProduct();
        newProduct.name = product.name;
        newProduct.productionDate = product.productionDate;
        newProduct.hersteller = product.hersteller;
        newProduct.weinart = product.weinart;
        newProduct.weinfarbe = product.weinfarbe;
        newProduct.milliliter = product.milliliter;
        newProduct.region = product.region;
        newProduct.land = product.land;
        newProduct.traubensorte = product.traubensorte;
        newProduct.klassifikation = product.klassifikation;
        newProduct.alkoholgehalt = product.alkoholgehalt;
        newProduct.ausbau = product.ausbau;
        newProduct.biologisch = product.biologisch;
        newProduct.trinkfensterVon = product.trinkfensterVon;
        newProduct.trinkfensterBis = product.trinkfensterBis;

        newProduct.relatedOrderItem.addRelated(orderItem);
        newProduct.price = orderItem.price;
        newProduct.priceCurrency = orderItem.priceCurrency;
        console.log("createProduct: created:", newProduct);
        return newProduct;
    }

}
