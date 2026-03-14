import {html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {BasePage} from "../common/base-page.ts";
import {Router, type RouterLocation} from "@vaadin/router";
import {Cellar} from "../../../domain/Cellar/Cellar.ts";
import {Bottle} from "../../../domain/Bottle/Bottle.ts";
import {ProductFilter} from "../../../domain/Product/ProductFilter.ts";
import {CDI} from "../../cdi/CDI.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-header.ts';
import '../components/kellermeister-footer.ts';
import '../components/kellermeister-wine-filter.ts';
import '../components/bottle-component.ts';
import {router} from "../router.ts";

@customElement('cellar-page')
class CellarPage extends BasePage {

    @property()
    cellarId?: string;

    @state()
    cellar?: Cellar = undefined;

    @state()
    bottles: Map<string, Bottle[]>;

    @state()
    filter: ProductFilter;

    private cdi: CDI = CDI.getInstance();

    constructor() {
        super();
        this.filter = new ProductFilter();
        this.bottles = new Map<string, Bottle[]>;
    }

    async onBeforeEnter(location: RouterLocation) {
        const { cellarId } = location.params;
        await this.loadCellar(cellarId as string);
        await this.loadBottles();
    }

    render() {
        return html`
          <kellermeister-header>Keller ${this.cellar?.name}
              <kellermeister-button slot="actions" text="Sprudel" @click="${this.handleSprudelFilterClick}" .ghost=${this.filter.isSprudel} icon="wine-bubble" size="small"></kellermeister-button>
              <kellermeister-button slot="actions" text="Rot" @click="${this.handleRedFilterClick}" .ghost=${this.filter.isRed} icon="wine-red" size="small"></kellermeister-button>
              <kellermeister-button slot="actions" text="Weiss" @click="${this.handleWhiteFilterClick}" .ghost=${this.filter.isWhite} icon="wine-white" size="small"></kellermeister-button>
              <kellermeister-button slot="actions" text="Rosé" @click="${this.handleRoseFilterClick}" .ghost=${this.filter.isRose} icon="wine-rose" size="small"></kellermeister-button>
              <kellermeister-button slot="actions" text="Kellerarbeit" @click="${this.handleCellarworkClick}" icon="work" size="small"></kellermeister-button>
          </kellermeister-header>
          <main>
              <div>
                    ${this.bottles.size > 0
                            ? html`
                              ${[...this.bottles.values()].map(
                                    bottles =>
                                        html`
                                            <li>
                                                <bottle-component .bottle="${bottles[0]}">
                                                    ${bottles[0].price}
                                                    <button class="bottle-button" slot="count">${bottles.length}</button>
                                                </bottle-component>
                                            </li>
                                      `
                            )}
                            `
                            : html`
                              <p>Es hat noch keine Flaschen in diesem Keller.</p>
                            `
                    }
              </div>
          </main>
          <footer>
              <kellermeister-footer></kellermeister-footer>
          </footer>
    `;
    }

    private async loadBottles() {
        if (this.cellar) {
            this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar);
        } else {
            console.log("loadBottle: failed, because cellar is undefined!");
        }
    }

    private async loadCellar(cellarId: string) {
        if (cellarId) {
            const cellar: Cellar | null = await this.cdi.getKellermeisterService().getCellarById(cellarId);
            if (cellar) {
                this.cellar = cellar;
            }
        } else {
            console.log("loadCellar: failed, because cellarId is undefined!");
        }
    }

    private handleCellarworkClick() {
        if (this.cellar) {
            Router.go(router.urlForName('cellarwork-page', {cellarId: `${this.cellar.id}`}));
        }
    }

    private async handleSprudelFilterClick(): void {
        this.filter.toggleSprudelFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleRedFilterClick(): void {
        this.filter.toggleRedFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleWhiteFilterClick(): void {
        this.filter.toggleWhiteFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleRoseFilterClick(): void {
        this.filter.toggleRoseFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'cellar-page': CellarPage;
    }
}