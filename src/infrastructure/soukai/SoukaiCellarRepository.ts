import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import type {Cellar} from "../../domain/Cellar/Cellar.ts";
import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {bootModels} from "soukai";
import {fetchLive} from "./localFirstQuery.ts";
import {mintProvisional, WELL_KNOWN_CELLAR} from "../shared/resource-identity.ts";

/**
 * Local-first, per-resource cellar repository. Cellars are minted with a
 * provisional `local://cellars/<uuid>#it` identity (well-known cellars use fixed
 * slugs) and re-homed to the Pod on the first sync after login. All reads/writes
 * are local (IndexedDB); the Pod is reached only by the sync layer.
 */
export class SoukaiCellarRepository implements CellarRepository {

    constructor(private readonly podBase: () => string | null) {
        bootModels({SoukaiCellar});
    }

    async createCellar(name: string): Promise<Cellar> {
        const cellar = new SoukaiCellar({url: mintProvisional("cellars"), name, displayOrder: 10});
        return await cellar.save();
    }

    async createCellarForAltglass(): Promise<Cellar> {
        return await new SoukaiCellar({url: this.getAltglassId(), name: "Altglass", displayOrder: -1}).save();
    }

    async createCellarForCellarwork(): Promise<Cellar> {
        return await new SoukaiCellar({url: this.getCellarWorkId(), name: "Eingang", displayOrder: -1}).save();
    }

    async deleteCellar(cellar: Cellar): Promise<void> {
        await (cellar as SoukaiCellar).delete();
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
