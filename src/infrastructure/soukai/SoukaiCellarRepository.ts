import type {CellarRepository} from "../../domain/Cellar/CellarRepository.ts";
import type {Cellar} from "../../domain/Cellar/Cellar.ts";
import {SoukaiCellar} from "./model/SoukaiCellar.ts";
import {bootModels} from "soukai";

export class SoukaiCellarRepository implements CellarRepository {

    private cellarUrl: string;
    private cellarUrlForCellarwork: string;
    private cellarUrlForAltglass: string;

    constructor(storageUrl: URL) {
        this.cellarUrl = storageUrl.toString() + 'private/kellermeister/cellars/';
        this.cellarUrlForCellarwork = this.cellarUrl + 'cellarWork#it'
        this.cellarUrlForAltglass = this.cellarUrl + 'altglass#it'
        bootModels({ SoukaiCellar });
    }

    async createCellar(name: string): Promise<Cellar> {
        return await SoukaiCellar.at(this.cellarUrl).create({ name: name, displayOrder: 10 });
    }

    async createCellarForAltglass(): Promise<Cellar> {
        var cellarForAltglass = new SoukaiCellar({
            url: this.cellarUrlForAltglass,
            name: 'Altglass',
            displayOrder: -1
        });
        return cellarForAltglass.save();
    }

    async createCellarForCellarwork(): Promise<Cellar> {
        var cellarForCellarwork = new SoukaiCellar({
            url: this.cellarUrlForCellarwork,
            name: 'Eingang',
            displayOrder: -1
        });
        return cellarForCellarwork.save();
    }

    async deleteCellar(cellar: Cellar): Promise<void> {
        await (cellar as SoukaiCellar).delete();
    }

    async fetchCellarById(cellarId:string): Promise<Cellar | null> {
        const cellar: Cellar | null = await SoukaiCellar.find(cellarId) ?? null;
        if (cellar) {
            return cellar;
        } else {
            if (this.cellarUrlForAltglass === cellarId) {
                return await this.createCellarForAltglass();
            }
        }
        return null;
    }

    async fetchCellarForAltglass(): Promise<Cellar> {
        var cellarForAltglass: Cellar | null = await SoukaiCellar.find(this.cellarUrlForAltglass);
        if (!cellarForAltglass) {
            return await this.createCellarForAltglass();
        }
        return cellarForAltglass;
    }

    async fetchCellarForCellarwork(): Promise<Cellar> {
        var cellarForCellarwork: Cellar | null = await SoukaiCellar.find(this.cellarUrlForCellarwork);
        if (!cellarForCellarwork) {
            return await this.createCellarForCellarwork();
        }
        return cellarForCellarwork;
    }

    async fetchCellars(): Promise<Cellar[]> {
        return await SoukaiCellar.from(this.cellarUrl).all();
    }

    getAltglassId(): string {
        return this.cellarUrlForAltglass;
    }

    getCellarWorkId(): string {
        return this.cellarUrlForCellarwork;
    }

}