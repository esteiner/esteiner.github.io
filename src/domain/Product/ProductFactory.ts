import type {OrderItem} from "../Order/OrderItem.ts";
import type {Product} from "./Product.ts";

export interface ProductFactory {

    createProduct(product: Product, orderItem: OrderItem): Product;

}