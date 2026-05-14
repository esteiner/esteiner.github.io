import type {SellerModel} from "./SellerModel.ts";

export interface OrderModel {
    getId(): string;
    getOrderDate(): string;
    getOrderNumber(): string;
    getSeller(): SellerModel | undefined;
}