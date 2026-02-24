import type {BottlesContainer} from "./BottlesContainer.ts";

/**
 * Domain Interface: BottlesContainer Repository
 * Defines the contract for fetching bottle information
 */
export interface BottlesContainerRepository {

    /**
     * Fetches BottlesContainer.
     */
    fetchBottlesContainer(): Promise<BottlesContainer | null>;

}