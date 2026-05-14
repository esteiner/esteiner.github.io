import type {Cellar} from "./Cellar.ts";

/**
 * Domain Interface: Cellar Repository
 * Defines the contract for fetching cellar information
 */
export interface CellarRepository {

    /**
     * Create a new cellar for the given name.
     *
     * @param name of the new cellar to be created
     */
    createCellar(name: string): Promise<Cellar>;

    createCellarForAltglass(): Promise<Cellar>;

    createCellarForCellarwork(): Promise<Cellar>;

    deleteCellar(cellar: Cellar): Promise<void>;

    /**
     * Fetches all cellars.
     */
    fetchCellars(): Promise<Cellar[]>;

    /**
     * Fetch a cellar by its id.
     */
    fetchCellarById(cellarId: string): Promise<Cellar | null>;

    fetchCellarForAltglass(): Promise<Cellar>;

    fetchCellarForCellarwork(): Promise<Cellar>;

    getAltglassId(): string;

    getCellarWorkId(): string;
}