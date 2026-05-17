import {css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {Task} from '@lit/task';
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import {BasePage} from "../common/base-page.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import "../components/orders-component.ts";
import {CDI} from "../../cdi/CDI.ts";
import {ProductFilter} from "../../../domain/Product/ProductFilter";
import type {Order} from "../../../domain/Order/Order.ts";

@customElement('order-page')
class OrderPage extends BasePage {

    @state()
    session: Session = getDefaultSession()

    @state()
    filter: ProductFilter;

    @state()
    private showSearchInput: boolean = false;

    @state()
    private searchText: string = '';

    private cdi: CDI = CDI.getInstance();

    private _ordersTask = new Task(this, async () => {
        if (this.session.info.isLoggedIn) {
            return await this.cdi.getKellermeisterService().ordersGroupedByMonth(this.filter);
        }
        return new Map<Date, Order[]>();
    });

    constructor() {
        super();
        this.filter = new ProductFilter();
    }

    updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('showSearchInput') && this.showSearchInput) {
            this.shadowRoot?.querySelector<HTMLInputElement>('.search-input')?.focus();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._ordersTask.run();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    background: var(--km-bg, #F7F5F1);
                }

                .filter {
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    padding: 12px 8px;
                }

                main {
                    padding: 8px 16px 16px;
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

                /* Spinner */
                .spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid var(--km-border, #E4DFD7);
                    border-top-color: var(--app-color-primary, #3A6B28);
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    margin: 16px auto;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `
        ];
    }

    render() {
        return html`
            <kellermeister-header>Kellermeister Einkäufe
                <kellermeister-button slot="actions" text="Search" @click="${this.handleTextFilterClick}" .ghost=${this.filter.isText} icon="search" size="small"></kellermeister-button>
            </kellermeister-header>
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
            <div class="filter">
                <kellermeister-button text="Sprudel" @click="${this.handleSprudelFilterClick}" .ghost=${this.filter.isSprudel} icon="wine-bubble" size="small"></kellermeister-button>
                <kellermeister-button text="Rot" @click="${this.handleRedFilterClick}" .ghost=${this.filter.isRed} icon="wine-red" size="small"></kellermeister-button>
                <kellermeister-button text="Weiss" @click="${this.handleWhiteFilterClick}" .ghost=${this.filter.isWhite} icon="wine-white" size="small"></kellermeister-button>
                <kellermeister-button text="Rosé" @click="${this.handleRoseFilterClick}" .ghost=${this.filter.isRose} icon="wine-rose" size="small"></kellermeister-button>
            </div>
            <main>
                <div>
                    ${this._ordersTask.render({
                        pending: () => html`<div class="spinner"></div>`,
                        complete: (orders) => orders.size > 0
                            ? html`
                                ${[...orders.keys()].map(
                                        month => html`
                                            <orders-component .month="${month}" .orders="${orders.get(month)}">`
                                )}
                            `
                            : html`
                                <p>Es gibt noch keine Bestellungen.</p>
                            `,
                    })}
                </div>
            </main>
            <footer>
                <kellermeister-footer></kellermeister-footer>
            </footer>
        `;
    }

    private handleSprudelFilterClick(): void {
        this.filter.toggleSprudelFilter();
        this._ordersTask.run();
    }

    private handleRedFilterClick(): void {
        this.filter.toggleRedFilter();
        this._ordersTask.run();
    }

    private handleWhiteFilterClick(): void {
        this.filter.toggleWhiteFilter();
        this._ordersTask.run();
    }

    private handleRoseFilterClick(): void {
        this.filter.toggleRoseFilter();
        this._ordersTask.run();
    }

    private handleTextFilterClick(): void {
        if (this.showSearchInput) {
            this.showSearchInput = false;
        } else {
            this.searchText = this.filter.textFilter?.toString() ?? '';
            this.showSearchInput = true;
        }
    }

    private handleSearchInput(e: InputEvent): void {
        this.searchText = (e.target as HTMLInputElement).value;
        this.filter.textFilter = this.searchText || null;
        this.filter.isText = !!this.searchText;
        this._ordersTask.run();
    }

    private handleSearchClose(): void {
        this.showSearchInput = false;
    }

    private handleSearchClear(): void {
        this.showSearchInput = false;
        this.filter.textFilter = null;
        this.filter.isText = false;
        this.searchText = '';
        this._ordersTask.run();
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'order-page': OrderPage;
    }
}