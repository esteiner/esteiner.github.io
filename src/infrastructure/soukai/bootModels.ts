import "soukai-bis/patch-zod";
import {bootCoreModels, bootModels} from "soukai-bis";
import {installEngineContextManager} from "./engineContext.ts";

import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {SoukaiBottle} from "./model/SoukaiBottle.ts";
import {SoukaiProduct} from "./model/SoukaiProduct.ts";
import {SoukaiOrder} from "./model/SoukaiOrder.ts";
import {SoukaiOrderItem} from "./model/SoukaiOrderItem.ts";
import {SoukaiSeller} from "./model/SoukaiSeller.ts";
import {SoukaiCustomer} from "./model/SoukaiCustomer.ts";
import {SoukaiContactPoint} from "./model/SoukaiContactPoint.ts";
import {SoukaiRating} from "./model/SoukaiRating.ts";

let booted = false;

/**
 * Boot the soukai-bis core models (Metadata/Operation/Tombstone/TypeIndex/…) and
 * every Kellermeister domain model, keyed by class name so schema relations wired
 * via `requireBootedModel("Soukai…")` resolve. Idempotent: safe to call from the
 * app entry point, each repository constructor, and test setups.
 */
export function bootSoukaiModels(): void {
    if (booted) {
        return;
    }
    // Required before any `runWithEngine` (withRemoteEngine); bis ships no
    // default async context manager.
    installEngineContextManager();
    bootCoreModels();
    bootModels({
        SoukaiCellar,
        SoukaiBottle,
        SoukaiProduct,
        SoukaiOrder,
        SoukaiOrderItem,
        SoukaiSeller,
        SoukaiCustomer,
        SoukaiContactPoint,
        SoukaiRating,
    });
    booted = true;
}
