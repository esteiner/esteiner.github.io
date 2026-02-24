import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import {Cellar} from "../../domain/Cellar/Cellar.ts";

/**
 * Infrastructure: Solid Cellar Repository
 * Implements with Soukai using Inrupt's Solid client libraries
 */
export class SolidCellarRepository implements CellarRepository {

    private cellarUrl: string;
    private cellarUrlForCellarwork: string;
    private cellarUrlForAltglass: string;

    constructor(storageUrl: URL) {
        this.cellarUrl = storageUrl.toString() + 'private/kellermeister/cellars/';
        this.cellarUrlForCellarwork = this.cellarUrl + 'cellarWork#it'
        this.cellarUrlForAltglass = this.cellarUrl + 'altglass#it'
    }

    getAltglassId(): string {
        return this.cellarUrlForAltglass;
    }
    getCellarWorkId(): string {
        return this.cellarUrlForCellarwork;
    }

    async fetchCellars(): Promise<Cellar[]> {
        const cellars = await Cellar.from(this.cellarUrl).all();
        return cellars.filter(cellar => this.isVisible(cellar));
    }

    isVisible(cellar: Cellar): boolean {
        if (cellar.displayOrder) {
            return cellar.displayOrder > 0;
        }
        return true;
    }

    async fetchCellarById(cellarId:string): Promise<Cellar | null> {
        const cellar: Cellar | null = await Cellar.find(cellarId) ?? null;
        if (cellar) {
            return cellar;
        } else {
            if (this.cellarUrlForAltglass === cellarId) {
                return await this.createCellarForAltglass();
            }
        }
        return null;
    }

    async fetchCellarForCellarwork(): Promise<Cellar> {
        var cellarForCellarwork: Cellar | null = await Cellar.find(this.cellarUrlForCellarwork);
        if (!cellarForCellarwork) {
            return await this.createCellarForCellarwork();
        }
        return cellarForCellarwork;
    }

    async fetchCellarForAltglass(): Promise<Cellar> {
        var cellarForAltglass: Cellar | null = await Cellar.find(this.cellarUrlForAltglass);
        if (!cellarForAltglass) {
            return await this.createCellarForAltglass();
        }
        return cellarForAltglass;
    }

    async createCellar(name: string): Promise<Cellar> {
        return await Cellar.at(this.cellarUrl).create({ name: name, displayOrder: 10 });
    }

    async createCellarForCellarwork(): Promise<Cellar> {
        var cellarForCellarwork = new Cellar({
            url: this.cellarUrlForCellarwork,
            name: 'Eingang',
            displayOrder: -1
        });
        return cellarForCellarwork.save();
    }

    async createCellarForAltglass(): Promise<Cellar> {
        var cellarForAltglass = new Cellar({
            url: this.cellarUrlForAltglass,
            name: 'Altglass',
            displayOrder: -1
        });
        return cellarForAltglass.save();
    }

    async deleteCellar(cellar: Cellar): Promise<void> {
        await cellar.delete();
    }
}