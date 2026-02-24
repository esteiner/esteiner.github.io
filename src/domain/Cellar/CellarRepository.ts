import type {Cellar} from "./Cellar.ts";

/**
 * Domain Interface: Cellar Repository
 * Defines the contract for fetching cellar information
 */
export interface CellarRepository {

    /**
     * Fetches all cellars.
     */
    fetchCellars(): Promise<Cellar[]>;

    /**
     * Fetch a cellar by its id.
     */
    fetchCellarById(cellarId: string): Promise<Cellar | null>;

    /**
     * Create a new cellar for the given name.
     *
     * @param name of the new cellar to be created
     */
    createCellar(name: string): Promise<Cellar>;

    deleteCellar(cellar: Cellar): Promise<void>;

    getCellarWorkId(): string;

    fetchCellarForCellarwork(): Promise<Cellar>;

    createCellarForCellarwork(): Promise<Cellar>;

    getAltglassId(): string;

    fetchCellarForAltglass(): Promise<Cellar>;
}