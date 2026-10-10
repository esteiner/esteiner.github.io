import {describe, it, expect, beforeEach} from "vitest";
import {installMemoryEngine} from "../../../testing/soukai.ts";
import {SoukaiOrder} from "./SoukaiOrder.ts";
import {SoukaiOrderItem} from "./SoukaiOrderItem.ts";
import {SoukaiSeller} from "./SoukaiSeller.ts";

describe("SoukaiOrderItem getSellerName", () => {

    beforeEach(() => {
        installMemoryEngine();
    });

    function orderItem(sellerName: string | undefined | null, priceSource?: string): SoukaiOrderItem {
        const item = new SoukaiOrderItem({priceSource});
        const order = new SoukaiOrder();
        if (sellerName !== null) {
            const seller = new SoukaiSeller();
            seller.name = sellerName;
            order.relatedSeller.setRelated(seller);
        }
        item.relatedOrder.setRelated(order);
        return item;
    }

    it("returns the seller name, which wins over the price source", () => {
        expect(orderItem("Weinhaus", "Vinothek Zürich").getSellerName()).toBe("Weinhaus");
    });

    it("falls back to the price source when the order has no seller", () => {
        expect(orderItem(null, "Vinothek Zürich").getSellerName()).toBe("Vinothek Zürich");
    });

    it("falls back to the price source when the seller name is blank", () => {
        expect(orderItem("  ", "Vinothek Zürich").getSellerName()).toBe("Vinothek Zürich");
        expect(orderItem(undefined, "Vinothek Zürich").getSellerName()).toBe("Vinothek Zürich");
    });

    it("returns undefined when neither is available", () => {
        expect(orderItem(null).getSellerName()).toBeUndefined();
        expect(new SoukaiOrderItem().getSellerName()).toBeUndefined();
    });
});
