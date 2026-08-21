import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import type {Cellar} from "../../domain/Cellar/Cellar.ts";
import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {bootModels} from "soukai";
import {fetchLive} from "./localFirstQuery.ts";
import {mintProvisional, WELL_KNOWN_CELLAR} from "../shared/resource-identity.ts";
import {withLocalEngine} from "./engineScope.ts";

/**
 * Local-first, per-resource cellar repository. Cellars are minted with a
 * provisional `local://cellars/<uuid>#it` identity (well-known cellars use fixed
 * slugs) and re-homed to the Pod on the first sync after login. All reads/writes
 * are local (IndexedDB); the Pod is reached only by the sync layer.
 */
export class SoukaiCellarRepository implements CellarRepository {

    /**
     * Local-first startup bootstrap: ensures the two well-known cellars exist
     * before any login. Reads await this so early callers never race it.
     */
    private readonly ready: Promise<void>;

    constructor(private readonly podBase: () => string | null) {
        bootModels({SoukaiCellar});
        this.ready = this.ensureWellKnownCellars();
    }

    async createCellar(name: string): Promise<Cellar> {
        const cellar = new SoukaiCellar({url: mintProvisional("cellars"), name, displayOrder: 10});
        return await withLocalEngine(() => cellar.save());
    }

    async createCellarForAltglass(): Promise<Cellar> {
        return await this.ensureCellar(this.getAltglassId(), "Altglass", -1);
    }

    async createCellarForCellarwork(): Promise<Cellar> {
        return await this.ensureCellar(this.getCellarWorkId(), "Eingang", -1);
    }

    async ensureWellKnownCellars(): Promise<void> {
        await this.ensureCellar(this.getCellarWorkId(), "Eingang", -1);
        await this.ensureCellar(this.getAltglassId(), "Altglass", -1);
    }

    async deleteCellar(cellar: Cellar): Promise<void> {
        await withLocalEngine(() => (cellar as SoukaiCellar).delete());
    }

    async fetchCellarById(cellarId: string): Promise<Cellar | null> {
        const cellars = await this.fetchCellars();
        const found = cellars.find((cellar) => cellar.getId() === cellarId);
        if (found) {
            return found;
        }
        if (cellarId === this.getAltglassId()) {
            return await this.createCellarForAltglass();
        }
        if (cellarId === this.getCellarWorkId()) {
            return await this.createCellarForCellarwork();
        }
        return null;
    }

    async fetchCellarForAltglass(): Promise<Cellar> {
        return (await this.fetchCellarById(this.getAltglassId())) ?? (await this.createCellarForAltglass());
    }

    async fetchCellarForCellarwork(): Promise<Cellar> {
        return (await this.fetchCellarById(this.getCellarWorkId())) ?? (await this.createCellarForCellarwork());
    }

    async fetchCellars(): Promise<Cellar[]> {
        await this.ready;
        return await this.queryCellars();
    }

    /**
     * Idempotent create-if-absent for a fixed-slug cellar. Queries the store
     * directly (NOT via `fetchCellars`, which awaits `this.ready` and would
     * deadlock the startup bootstrap). Returns the existing cellar untouched if
     * present, otherwise creates it with the given name/order.
     */
    private async ensureCellar(id: string, name: string, displayOrder: number): Promise<Cellar> {
        const existing = (await this.queryCellars()).find((cellar) => cellar.getId() === id);
        if (existing) {
            return existing;
        }
        return await withLocalEngine(() => new SoukaiCellar({url: id, name, displayOrder}).save());
    }

    private async queryCellars(): Promise<SoukaiCellar[]> {
        return await fetchLive<SoukaiCellar>(SoukaiCellar, "cellars", this.podBase());
    }

    getAltglassId(): string {
        return this.wellKnownId(WELL_KNOWN_CELLAR.altglass);
    }

    getCellarWorkId(): string {
        return this.wellKnownId(WELL_KNOWN_CELLAR.cellarwork);
    }

    /**
     * The effective id of a well-known cellar: the deterministically-derived Pod
     * URL once a base is known (post-login, after re-home), otherwise the
     * provisional local URL. The slug is stable, so both agree via re-home.
     */
    private wellKnownId(slug: string): string {
        const base = this.podBase();
        return base ? `${base}cellars/${slug}#it` : `local://cellars/${slug}#it`;
    }
}
