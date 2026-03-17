import {css, html} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {customElement, property, state} from 'lit/decorators.js';
import { BasePage } from "../common/base-page.ts";
import {CDI} from "../../cdi/CDI.ts";
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import type {Cellar} from "../../../domain/Cellar/Cellar.ts";
import {Bottle} from "../../../domain/Bottle/Bottle.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import "../components/order-item-component.ts";
import "../components/bottle-component.ts";
import type {RouterLocation} from "@vaadin/router";
import {ProductFilter} from "../../../domain/Product/ProductFilter";

@customElement('cellarwork-page')
class CellarWorkPage extends BasePage {

    @property()
    sourceCellar?: Cellar;

    @state()
    session: Session = getDefaultSession()

    @state()
    bottles: Bottle[];

    @state()
    cellars: Cellar[];

    @state()
    cellarIds: string[];

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
        this.cellars = new Array();
        this.bottles = new Array();
        this.cellarIds = new Array();
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('showSearchInput') && this.showSearchInput) {
            this.shadowRoot?.querySelector<HTMLInputElement>('.search-input')?.focus();
        }
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .filter {
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    padding: 0 0 10px 0;
                }
                
                .table {
                    display: grid;
                    grid-template-columns: 60% repeat(var(--cellar-columns, 2), 1fr);
                }

                .header-row,
                .data-row {
                    display: contents;
                    padding: 0 8px;
                }
                
                .header-row span {
                    font-weight: bold;
                    background-color: white;
                    padding: 8px 8px 8px 16px;
                    border-bottom: 2px solid #333;
                    align-content: center;
                }

                .data-row span {
                    padding: 8px;
                    border-bottom: 1px solid #ddd;
                    align-content: center;
                }

                span:empty {
                    display: none;
                }
                
                span.column2 {
                    text-align: center;
                    align-content: start;
                }

                .search-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 2000;
                    display: flex;
                    align-items: flex-start;
                    padding-top: 104px;
                }

                .search-container {
                    width: calc(100% - 32px);
                    margin: 0 16px;
                    background: white;
                    border-radius: 12px;
                    padding: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }

                .search-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 9px 12px;
                    border-radius: 8px;
                    border: none;
                    background: #F2F2F7;
                    font-size: 16px;
                    outline: none;
                }
            `
        ];
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.sourceCellar || this.sourceCellar.id === this.cdi.getKellermeisterService().getCellarWorkId() ) {
            this.ingestOrdersFromInbox();
        } else {
            this.fetchBottlesFromCellar(this.sourceCellar);
        }
        this.fetchCellars();
    }

    async onBeforeEnter(location: RouterLocation) {
        const { cellarId } = location.params;
        await this.loadCellar(cellarId as string);
    }

    async ingestOrdersFromInbox(): Promise<void> {
        if (this.session.info.isLoggedIn) {
            this.sourceCellar = await this.cdi.getKellermeisterService().ingestOrdersFromInbox();
            if (this.sourceCellar) {
                this.fetchBottlesFromCellar(this.sourceCellar);
            }
        }
    }

    async fetchBottlesFromCellar(cellar: Cellar) {
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(cellar, this.filter);
        this.cellarIds = Array(this.bottles.length).fill(undefined, 0);
    }

    async fetchCellars() {
        if (this.session.info.isLoggedIn) {
            const customCellars = await this.cdi.getKellermeisterService().getAllCellars();
            const destinationCellars = customCellars.filter(cellar => cellar.id != this.sourceCellar?.id);
            const altglass = await this.cdi.getKellermeisterService().getCellarAltglass();
            if (altglass && altglass.id != this.sourceCellar?.id) {
                this.cellars = destinationCellars.concat([altglass]);
            } else {
                this.cellars = destinationCellars;
            }
        }
    }

    render() {
        return html`
            <kellermeister-header>Kellerarbeit ${this.sourceCellar?.name}
                <kellermeister-button slot="actions" text="Search" @click="${this.handleTextFilterClick}" .ghost=${this.filter.isText} icon="search" size="small"></kellermeister-button>
                <kellermeister-button @click="${this.handleIngestClick}" slot="actions" text="umbuchen" icon="wine-shelf"
                                      size="small"></kellermeister-button>
            </kellermeister-header>
            <div class="filter">
                <kellermeister-button text="Sprudel" @click="${this.handleSprudelFilterClick}" .ghost=${this.filter.isSprudel} icon="wine-bubble" size="small"></kellermeister-button>
                <kellermeister-button text="Rot" @click="${this.handleRedFilterClick}" .ghost=${this.filter.isRed} icon="wine-red" size="small"></kellermeister-button>
                <kellermeister-button text="Weiss" @click="${this.handleWhiteFilterClick}" .ghost=${this.filter.isWhite} icon="wine-white" size="small"></kellermeister-button>
                <kellermeister-button text="Rosé" @click="${this.handleRoseFilterClick}" .ghost=${this.filter.isRose} icon="wine-rose" size="small"></kellermeister-button>

            </div>
            ${this.showSearchInput ? html`
              <div class="search-overlay" @click="${this.handleSearchClose}">
                  <div class="search-container" @click="${(e: Event) => e.stopPropagation()}">
                      <input
                          class="search-input"
                          type="search"
                          .value="${this.searchText}"
                          @input="${this.handleSearchInput}"
                          @keydown="${(e: KeyboardEvent) => e.key === 'Escape' && this.handleSearchClose()}"
                          @search="${this.handleSearchClear}"
                          placeholder="Suchen..."
                      />
                  </div>
              </div>
          ` : ''}
            <main>
                <form @submit="${this.handleIngestClick}">
                    <div class="table" style="--cellar-columns: ${this.cellars.length};">
                        <div class="header-row">
                            <span class="column1">${this.bottles.length} Flaschen zum umbuchen</span>
                            ${repeat(this.cellars, (cellar) => cellar.id, (cellar) =>  html`
                                <span class="column2"><kellermeister-button @click="${() => this.handleCellarClick(cellar.id)}" class="column2" icon="wine-shelf" ghost size="small" text="${cellar.name}"></kellermeister-button></span>
                            `)}
                        </div>
                        <div class="data-row">
                            ${repeat(this.bottles, (bottle) => bottle.id, (bottle, index) =>  html`
                                <span class="column1">
                                    <bottle-component .bottle="${bottle}">${bottle.price}</bottle-component>
                                </span>
                                ${repeat(this.cellars, (cellar) => cellar.id, (cellar, cellarIndex) =>  html`
                                    <span class="column2"><input @input="${this.handleCellarSelectionClick}" ${cellarIndex}" type="radio" id="${index}" name="${index}" value="${cellar.id}" .checked=${this.cellarIds[cellarIndex] === cellar.id}/></span>
                                `)}
                            `)}
                        </div>
                    </div>
                </form>
            </main>
            <footer>
                <kellermeister-footer></kellermeister-footer>
            </footer>
        `;
    }

    private async loadCellar(cellarId: string) {
        if (cellarId) {
            const cellar: Cellar | null = await this.cdi.getKellermeisterService().getCellarById(cellarId);
            if (cellar) {
                this.sourceCellar = cellar;
            }
        } else {
            console.log("loadCellar: failed, because cellarId is undefined!");
        }
    }

    private async handleIngestClick(e: Event) {
        e.preventDefault()
        await this.cdi.getKellermeisterService().transferBottles(this.bottles, this.cellarIds);
        if (this.sourceCellar) {
            this.fetchBottlesFromCellar(this.sourceCellar);
        }
    }

    private handleCellarSelectionClick(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        const input = e.target as HTMLInputElement;
        this.cellarIds[Number(input.id)] = input.value;
    }

    private handleCellarClick(cellarId: string) {
        console.log("handleCellarClick: to cellar:", cellarId);
        this.cellarIds = Array(this.bottles.length).fill(cellarId, 0);
        console.log("handleCellarClick: ", this.cellarIds);
    }

    private async handleSprudelFilterClick(): Promise<void> {
        this.filter.toggleSprudelFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(this.sourceCellar, this.filter);
    }

    private async handleRedFilterClick(): Promise<void> {
        this.filter.toggleRedFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(this.sourceCellar, this.filter);
    }

    private async handleWhiteFilterClick(): Promise<void> {
        this.filter.toggleWhiteFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(this.sourceCellar, this.filter);
    }

    private async handleRoseFilterClick(): Promise<void> {
        this.filter.toggleRoseFilter();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(this.sourceCellar, this.filter);
    }

    private handleTextFilterClick(): void {
        if (this.showSearchInput) {
            this.showSearchInput = false;
        } else {
            this.searchText = this.filter.textFilter?.toString() ?? '';
            this.showSearchInput = true;
        }
    }

    private async handleSearchInput(e: InputEvent): Promise<void> {
        this.searchText = (e.target as HTMLInputElement).value;
        this.filter.textFilter = this.searchText || null;
        this.filter.isText = !!this.searchText;
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(this.sourceCellar, this.filter);
    }

    private handleSearchClose(): void {
        this.showSearchInput = false;
    }

    private async handleSearchClear(): Promise<void> {
        this.showSearchInput = false;
        this.filter.textFilter = null;
        this.filter.isText = false;
        this.searchText = '';
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(this.sourceCellar, this.filter);
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'cellarwork-page': CellarWorkPage;
    }
}