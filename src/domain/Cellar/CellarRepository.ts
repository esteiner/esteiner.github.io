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

    /**
     * Ensure both well-known cellars (cellarwork and altglass) exist.
     *
     * Idempotent (create-if-absent): if a well-known cellar already exists it is
     * left untouched — neither duplicated nor overwritten (a user-renamed display
     * name is preserved) — and any missing one is created with its fixed slug and
     * default display name. Safe to call repeatedly (startup, container
     * resolution, after a restart).
     */
    ensureWellKnownCellars(): Promise<void>;

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