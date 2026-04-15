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

    @state()
    private ratingBottle?: Bottle = undefined;

    @state()
    private selectedRating?: number = undefined;

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
        this.filter = ProductFilter.fromSearchParams(new URLSearchParams(location.search));
        if (this.filter.textFilter) {
            this.searchText = this.filter.textFilter;
        }
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
          ${this.ratingBottle ? html`
              <div class="rating-overlay">
                  <div class="rating-container">
                      <div class="rating-title">Bewertung</div>
                      <div class="rating-product">${this.ratingBottle.product?.name}</div>
                      <div class="rating-buttons">
                          ${[0, 1, 2, 3].map(value => html`
                              <button
                                  class="rating-button ${this.selectedRating === value ? 'selected' : ''}"
                                  @click="${() => this.handleRatingSelect(value)}"
                              >${value}</button>
                          `)}
                      </div>
                      <div class="rating-actions">
                          <button class="rating-action cancel" @click="${this.handleRatingCancel}">Abbrechen</button>
                          <button class="rating-action confirm" @click="${this.handleRatingConfirm}">Altglass</button>
                      </div>
                  </div>
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
                                                    ${bottles[0].price} ${bottles[0].priceCurrency}
                                                    <button @click="${() => this.handleBottleClick(bottles[0])}" class="bottle-button" slot="count">${bottles.length}</button>
                                                </bottle-component>
                                            </li>
                                      `
                            )}
                            `
                            : html`
                              <p class="no-bottles">Keine Flaschen in diesem Keller gefunden.</p>
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

    private updateUrl(): void {
        const params = this.filter.toSearchParams();
        const search = params.toString() ? '?' + params.toString() : '';
        history.replaceState(null, '', window.location.pathname + search);
    }

    private handleCellarworkClick() {
        if (this.cellar) {
            const params = this.filter.toSearchParams();
            const search = params.toString() ? '?' + params.toString() : '';
            Router.go(router.urlForName('cellarwork-page', {cellarId: `${this.cellar.id}`}) + search);
        }
    }

    private async handleSprudelFilterClick(): Promise<void> {
        this.filter.toggleSprudelFilter();
        this.updateUrl();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleRedFilterClick(): Promise<void> {
        this.filter.toggleRedFilter();
        this.updateUrl();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleWhiteFilterClick(): Promise<void> {
        this.filter.toggleWhiteFilter();
        this.updateUrl();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private async handleRoseFilterClick(): Promise<void> {
        this.filter.toggleRoseFilter();
        this.updateUrl();
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

    private async handleSearchInput(e: InputEvent): Promise<void> {
        this.searchText = (e.target as HTMLInputElement).value;
        this.filter.textFilter = this.searchText || null;
        this.filter.isText = !!this.searchText;
        this.updateUrl();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private handleSearchClose(): void {
        this.showSearchInput = false;
    }

    private async handleSearchClear(): Promise<void> {
        this.showSearchInput = false;
        this.filter.textFilter = null;
        this.filter.isText = false;
        this.searchText = '';
        this.updateUrl();
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellarGroupedByProduct(this.cellar, this.filter);
    }

    private handleBottleClick(bottle: Bottle): void {
        this.ratingBottle = bottle;
        this.selectedRating = bottle.rating;
    }

    private handleRatingSelect(rating: number): void {
        this.selectedRating = rating;
    }

    private handleRatingCancel(): void {
        this.ratingBottle = undefined;
        this.selectedRating = undefined;
    }

    private async handleRatingConfirm(): Promise<void> {
        if (this.ratingBottle) {
            await this.cdi.getKellermeisterService().disposeBottleToAltglass(this.ratingBottle, this.selectedRating);
            await this.loadBottles();
        }
        this.ratingBottle = undefined;
        this.selectedRating = undefined;
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    background: var(--km-bg, #F7F5F1);
                }

                main {
                    padding: 0 16px 16px 16px;
                }

                .filter {
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    padding: 12px 8px;
                }

                .bottles {
                    padding: 0;
                    background: var(--km-surface, white);
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--km-border, #E4DFD7);
                }

                li {
                    list-style: none;
                    display: block;
                    background: var(--km-surface, white);
                }

                li:not(:last-child) {
                    border-bottom: 1px solid var(--km-border, #E4DFD7);
                }

                .bottle-button {
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text-muted, #8A8278);
                    border: 1px solid var(--km-border, #E4DFD7);
                    border-radius: 20px;
                    padding: 3px 10px;
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 12px;
                    font-weight: 500;
                    min-width: 28px;
                    cursor: default;
                    letter-spacing: 0.02em;
                }

                .search-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(26, 25, 23, 0.4);
                    z-index: 2000;
                    display: flex;
                    align-items: flex-start;
                    padding-top: 90px;
                    backdrop-filter: blur(4px);
                }

                .search-container {
                    width: calc(100% - 32px);
                    margin: 0 16px;
                    background: var(--km-surface, white);
                    border-radius: 12px;
                    border: 1px solid var(--km-border, #E4DFD7);
                    padding: 12px;
                    box-shadow: 0 16px 48px rgba(26, 25, 23, 0.15);
                }

                .search-input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1.5px solid var(--km-border, #E4DFD7);
                    background: var(--km-bg, #F7F5F1);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 15px;
                    color: var(--km-text, #1A1917);
                    outline: none;
                    transition: border-color 0.2s ease;
                }

                .search-input:focus {
                    border-color: var(--app-color-primary, #3A6B28);
                }
                
                .no-bottles {
                    text-align: center;
                }

                .rating-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(26, 25, 23, 0.4);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(4px);
                }

                .rating-container {
                    width: calc(100% - 64px);
                    max-width: 360px;
                    background: var(--km-surface, white);
                    border-radius: 12px;
                    border: 1px solid var(--km-border, #E4DFD7);
                    padding: 20px;
                    box-shadow: 0 16px 48px rgba(26, 25, 23, 0.15);
                }

                .rating-title {
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--km-text, #1A1917);
                    text-align: center;
                    margin-bottom: 4px;
                }

                .rating-product {
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 14px;
                    color: var(--km-text-muted, #8A8278);
                    text-align: center;
                    margin-bottom: 20px;
                }

                .rating-buttons {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                }

                .rating-button {
                    flex: 1;
                    aspect-ratio: 1;
                    border-radius: 50%;
                    border: 1.5px solid var(--km-border, #E4DFD7);
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text, #1A1917);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 20px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease;
                }

                .rating-button:hover {
                    border-color: var(--app-color-primary, #3A6B28);
                }

                .rating-button:active {
                    transform: scale(0.94);
                }

                .rating-button.selected {
                    background: var(--app-color-primary, #3A6B28);
                    color: white;
                    border-color: var(--app-color-primary, #3A6B28);
                }

                .rating-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    margin-top: 20px;
                }

                .rating-action {
                    flex: 1;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: transform 0.15s ease, opacity 0.15s ease;
                }

                .rating-action:active {
                    transform: scale(0.97);
                    opacity: 0.85;
                }

                .rating-action.cancel {
                    background: var(--km-bg, #F7F5F1);
                    color: var(--km-text-muted, #8A8278);
                    border: 1.5px solid var(--km-border, #E4DFD7);
                }

                .rating-action.confirm {
                    background: var(--app-color-primary, #3A6B28);
                    color: white;
                    border: 1.5px solid var(--app-color-primary, #3A6B28);
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