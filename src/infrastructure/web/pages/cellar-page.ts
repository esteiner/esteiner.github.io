import {css, html} from 'lit';
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

    @state()
    private showSearchInput: boolean = false;

    @state()
    private searchText: string = '';

    private cdi: CDI = CDI.getInstance();

    constructor() {
        super();
        this.filter = new ProductFilter();
        this.bottles = new Map<string, Bottle[]>;
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('showSearchInput') && this.showSearchInput) {
            this.shadowRoot?.querySelector<HTMLInputElement>('.search-input')?.focus();
        }
    }

    async onBeforeEnter(location: RouterLocation) {
        const { cellarId } = location.params;
        await this.loadCellar(cellarId as string);
        await this.loadBottles();
    }

    render() {
        return html`
          <kellermeister-header>Keller ${this.cellar?.name}
              <kellermeister-button slot="actions" text="Search" @click="${this.handleTextFilterClick}" .ghost=${this.filter.isText} icon="search" size="small"></kellermeister-button>
              <kellermeister-button slot="actions" text="Kellerarbeit" @click="${this.handleCellarworkClick}" icon="work" size="small"></kellermeister-button>
          </kellermeister-header>
          <div class="filter">
              <kellermeister-button text="Sprudel" @click="${this.handleSprudelFilterClick}" .ghost=${this.filter.isSprudel} icon="wine-bubble" size="small"></kellermeister-button>
              <kellermeister-button text="Rot" @click="${this.handleRedFilterClick}" .ghost=${this.filter.isRed} icon="wine-red" size="small"></kellermeister-button>
              <kellermeister-button text="Weiss" @click="${this.handleWhiteFilterClick}" .ghost=${this.filter.isWhite} icon="wine-white" size="small"></kellermeister-button>
              <kellermeister-button text="Rosé" @click="${this.handleRoseFilterClick}" .ghost=${this.filter.isRose} icon="wine-rose" size="small"></kellermeister-button>
              </div>
          ${this.showSearchInput ? html`
              <div class="search-bar">
                  <input
                      class="search-input"
                      type="search"
                      .value="${this.searchText}"
                      @input="${(e: InputEvent) => this.searchText = (e.target as HTMLInputElement).value}"
                      @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this.handleSearchCommit()}"
                      @search="${this.handleSearchClear}"
                      placeholder="Suchen..."
                  />
              </div>
          ` : ''}
          <main>
              <div class="bottles">
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
            this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
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

    private async handleSprudelFilterClick(): Promise<void> {
        this.filter.toggleSprudelFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleRedFilterClick(): Promise<void> {
        this.filter.toggleRedFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleWhiteFilterClick(): Promise<void> {
        this.filter.toggleWhiteFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleRoseFilterClick(): Promise<void> {
        this.filter.toggleRoseFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private handleTextFilterClick(): void {
        if (this.showSearchInput) {
            this.showSearchInput = false;
        } else {
            this.searchText = this.filter.textFilter?.toString() ?? '';
            this.showSearchInput = true;
        }
    }

    private async handleSearchCommit(): Promise<void> {
        this.showSearchInput = false;
        this.filter.textFilter = this.searchText || null;
        this.filter.isText = !!this.searchText;
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleSearchClear() {
        this.showSearchInput = false;
        this.filter.textFilter = null;
        this.filter.isText = false;
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .filter {
                    display: flex;
                    align-items: center;
                    padding: 0 0 10px 16px;
                }
                
                .bottles {
                    padding: 0 8px;    
                }
                
                .search-bar {
                    position: fixed;
                    top: 90px;
                    left: 0;
                    right: 0;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    border-bottom: 1px solid #e0e0e0;
                    z-index: 999;
                    box-sizing: border-box;
                }

                .search-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    background: #f9f9f9;
                    font-size: 15px;
                    outline: none;
                }

                .search-input:focus {
                    border-color: #007aff;
                }
            `
        ];
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'cellar-page': CellarPage;
    }
}