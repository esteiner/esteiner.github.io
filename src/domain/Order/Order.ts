import type {Seller} from "./Seller.ts";

export interface Order {
    getId(): string;
    getOrderDate(): string;
    getOrderNumber(): string;
    getSeller(): Seller | undefined;
}