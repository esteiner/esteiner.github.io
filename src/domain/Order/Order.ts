import type {Seller} from "./Seller.ts";

export interface Order {
    getId(): string;
    getOrderDate(): Date;
    getOrderNumber(): string;
    getSeller(): Seller | undefined;
}