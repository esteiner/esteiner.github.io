import type {BottlesStorage} from "./BottlesStorage.ts";

export interface BottlesStorageRepository {

    /**
     * Fetches the BottleStorage.
     */
    fetchBottlesStorage(): Promise<BottlesStorage | undefined>;

    save(bottlesStorage: BottlesStorage): Promise<BottlesStorage | undefined>;

}