import type {OrderModel} from "./OrderModel.ts";

export interface OrderItemModel {
    getId(): string;
    getPrice(): number;
    getPriceCurrency(): string;
    getOrderQuantity(): number;
    getOrder(): OrderModel;
}