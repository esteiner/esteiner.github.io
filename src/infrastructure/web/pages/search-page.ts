import {css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {BasePage} from "../common/base-page.ts";
import {Router, type RouterLocation} from "@vaadin/router";
import {router} from "../router.ts";
import {Cellar} from "../../../domain/Cellar/Cellar.ts";
import {Bottle} from "../../../domain/Bottle/Bottle.ts";
import {ProductFilter} from "../../../domain/Product/ProductFilter.ts";
import {CDI} from "../../cdi/CDI.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-header.ts';
import '../components/kellermeister-footer.ts';
import '../components/bottle-component.ts';

@customElement('search-page')
class SearchPage extends BasePage {

    @state()
    filter: ProductFilter;

    @state()
    results: Map<Cellar, Map<string, Bottle[]>>;

    @state()
    private searchText: string = '';

    private cdi: CDI = CDI.getInstance();

    constructor() {
        super();
        this.filter = new ProductFilter();
        this.results = new Map();
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('filter') || changedProperties.has('searchText')) {
            this.querySelector<HTMLInputElement>('.search-input')?.focus();
        }
    }

    async onBeforeEnter(location: RouterLocation) {
        this.filter = ProductFilter.fromSearchParams(new URLSearchParams(location.search));
        if (this.filter.textFilter) {
            this.searchText = this.filter.textFilter;
        }
        await this.loadResults();
    }

    render() {
        return html`
          <kellermeister-header>Suche
              <input
                  slot="actions"
                  class="search-input"
                  type="search"
                  .value="${this.searchText}"
                  @input="${this.handleSearchInput}"
                  @search="${this.handleSearchClear}"
                  placeholder="Suchen..."
                  autofocus
              />
          </kellermeister-header>
          <div class="filter">
              <kellermeister-button text="Sprudel" @click="${this.handleSprudelFilterClick}" .ghost=${this.filter.isSprudel} icon="wine-bubble" size="small"></kellermeister-button>
              <kellermeister-button text="Rot" @click="${this.handleRedFilterClick}" .ghost=${this.filter.isRed} icon="wine-red" size="small"></kellermeister-button>
              <kellermeister-button text="Weiss" @click="${this.handleWhiteFilterClick}" .ghost=${this.filter.isWhite} icon="wine-white" size="small"></kellermeister-button>
              <kellermeister-button text="Rosé" @click="${this.handleRoseFilterClick}" .ghost=${this.filter.isRose} icon="wine-rose" size="small"></kellermeister-button>
          </div>
          <main>
              ${this.renderResults()}
          </main>
          <footer>
              <kellermeister-footer></kellermeister-footer>
          </footer>
        `;
    }

    private renderResults() {
        if (this.results.size === 0) {
            return html`<p class="empty-state">Keine Flaschen gefunden.</p>`;
        }
        return html`
            ${[...this.results.entries()].map(([cellar, byProduct]) => {
                const totalBottles = [...byProduct.values()].reduce((sum, arr) => sum + arr.length, 0);
                return html`
                    <section class="cellar-section">
                        <h2 class="cellar-heading">
                            <a class="cellar-link" @click="${() => Router.go(router.urlForName('cellar-page', {cellarId: cellar.id!}))}">
                                ${cellar.name}
                            </a>
                            <span class="cellar-count">${totalBottles}</span>
                        </h2>
                        <div class="bottles">
                            ${[...byProduct.values()].map(bottles => html`
                                <li>
                                    <bottle-component .bottle="${bottles[0]}">
                                        ${bottles[0].getPrice()} ${bottles[0].getPriceCurrency()}
                                        <button class="bottle-button" slot="count">${bottles.length}</button>
                                    </bottle-component>
                                </li>
                            `)}
                        </div>
                    </section>
                `;
            })}
        `;
    }

    private async loadResults() {
        this.results = await this.cdi.getKellermeisterService().searchBottlesGroupedByCellar(this.filter);
    }

    private updateUrl(): void {
        const params = this.filter.toSearchParams();
        const search = params.toString() ? '?' + params.toString() : '';
        history.replaceState(null, '', window.location.pathname + search);
    }

    private async handleSearchInput(e: InputEvent): Promise<void> {
        this.searchText = (e.target as HTMLInputElement).value;
        this.filter.textFilter = this.searchText || null;
        this.filter.isText = !!this.searchText;
        this.updateUrl();
        await this.loadResults();
        this.requestUpdate('filter');
    }

    private async handleSearchClear(): Promise<void> {
        this.filter.textFilter = null;
        this.filter.isText = false;
        this.searchText = '';
        this.updateUrl();
        await this.loadResults();
        this.requestUpdate('filter');
    }

    private async handleSprudelFilterClick(): Promise<void> {
        this.filter.toggleSprudelFilter();
        this.updateUrl();
        await this.loadResults();
        this.requestUpdate('filter');
    }

    private async handleRedFilterClick(): Promise<void> {
        this.filter.toggleRedFilter();
        this.updateUrl();
        await this.loadResults();
        this.requestUpdate('filter');
    }

    private async handleWhiteFilterClick(): Promise<void> {
        this.filter.toggleWhiteFilter();
        this.updateUrl();
        await this.loadResults();
        this.requestUpdate('filter');
    }

    private async handleRoseFilterClick(): Promise<void> {
        this.filter.toggleRoseFilter();
        this.updateUrl();
        await this.loadResults();
        this.requestUpdate('filter');
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    background: var(--km-bg, #F7F5F1);
                }

                .search-input {
                    box-sizing: border-box;
                    padding: 7px 12px;
                    border-radius: 8px;
                    border: 1.5px solid var(--km-border, #E4DFD7);
                    background: var(--km-bg, #F7F5F1);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 14px;
                    color: var(--km-text, #1A1917);
                    outline: none;
                    transition: border-color 0.2s ease;
                    width: 160px;
                }

                .search-input:focus {
                    border-color: var(--app-color-primary, #3A6B28);
                }

                .filter {
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    padding: 12px 8px;
                }

                main {
                    padding: 0 16px 16px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .empty-state {
                    text-align: center;
                    color: var(--km-text-muted, #8A8278);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 15px;
                    padding: 32px 0;
                }

                .cellar-section {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .cellar-link {
                    color: inherit;
                    text-decoration: none;
                    cursor: pointer;
                }

                .cellar-link:hover {
                    text-decoration: underline;
                }

                .cellar-heading {
                    font-family: var(--app-font-family-display, Georgia, serif);
                    font-size: 18px;
                    font-weight: normal;
                    color: var(--km-text, #1A1917);
                    margin: 0 0 4px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .cellar-count {
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--km-text-muted, #8A8278);
                    background: var(--km-bg, #F7F5F1);
                    border: 1px solid var(--km-border, #E4DFD7);
                    border-radius: 20px;
                    padding: 2px 8px;
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
            `
        ];
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'search-page': SearchPage;
    }
}
