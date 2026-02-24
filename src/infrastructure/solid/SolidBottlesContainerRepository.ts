import {BottlesContainer} from "../../domain/Bottle/BottlesContainer.ts";
import type {BottlesContainerRepository} from "../../domain/Bottle/BottlesContainerRepository.ts";

/**
 * Infrastructure: Solid Bottle Repository
 * Implements fetching using Inrupt's Solid client libraries
 */
export class SolidBottlesContainerRepository implements BottlesContainerRepository {

    private bottlesUrl: string;

    constructor(storageUrl: URL) {
        this.bottlesUrl = storageUrl.toString() + 'private/kellermeister/bottles/bottles#it';
    }

    async fetchBottlesContainer(): Promise<BottlesContainer | null> {
        const bottlesContainer: BottlesContainer | null = await BottlesContainer.find(this.bottlesUrl);
        if (bottlesContainer) {
            return bottlesContainer;
        } else {
            console.log("fetchBottlesContainer: not found, creating it now");
            let newBottlesContainer = new BottlesContainer({ url: this.bottlesUrl });
            return await newBottlesContainer.save();
        }
    }

}