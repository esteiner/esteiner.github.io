import {Product} from "./Product.ts";
import {OrderItem} from "../Order/OrderItem.ts";

export class ProductFactory {

    public createProduct(product: Product, orderItem: OrderItem): Product {
        const newProduct: Product = new Product();
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
