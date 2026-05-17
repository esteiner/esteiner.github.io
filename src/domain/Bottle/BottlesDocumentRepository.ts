import type {BottlesDocument} from "./BottlesDocument.ts";

export interface BottlesDocumentRepository {

    /**
     * Fetches the BottleStorage.
     */
    fetchBottlesStorage(): Promise<BottlesDocument | undefined>;

    save(bottlesStorage: BottlesDocument): Promise<BottlesDocument | undefined>;

}