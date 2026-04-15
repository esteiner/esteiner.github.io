import {Product} from "./Product.ts";
import {Order} from "../Order/Order.ts";

export class ProductFactory {

    public createProduct(product: Product, order:Order): Product {
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
        newProduct.relatedOrder.addRelated(order);
        //const relation = newProduct.getRelation('order');
        console.log("createProduct: created:", newProduct);
        return newProduct;
    }

}
