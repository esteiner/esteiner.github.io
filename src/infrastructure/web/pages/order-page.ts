import {css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import {BasePage} from "../common/base-page.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import "../components/orders-component.ts";
import {Order} from "../../../domain/Order/Order.ts";
import {CDI} from "../../cdi/CDI.ts";
import {ProductFilter} from "../../../domain/Product/ProductFilter";

@customElement('order-page')
class OrderPage extends BasePage {

    @property()
    orders: Map<Date, Order[]>;

    @state()
    session: Session = getDefaultSession()

    @state()
    filter: ProductFilter;

    private cdi: CDI = CDI.getInstance();

    constructor() {
        super();
        this.filter = new ProductFilter();
        this.orders = new Map<Date, Order[]>;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchOrders();
    }

    async fetchOrders() {
        if (this.session.info.isLoggedIn) {
            this.orders = await this.cdi.getKellermeisterService().ordersGroupedByMonth(this.filter);

        }
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    background: #F2F2F7;
                }

                .filter {
                    display: flex;
                    justify-content: space-evenly;
                    align-items: center;
                    padding: 10px 0 10px 0;
                }

                main {
                    padding: 16px;
                }
            `
        ];
    }

    render() {
        return html`
            <kellermeister-header>Kellermeister Einkäufe
                <kellermeister-button slot="actions" text="Search" .ghost=${this.filter.isText} icon="search" size="small"></kellermeister-button>
            </kellermeister-header>
            <div class="filter">
                <kellermeister-button text="Sprudel" @click="${this.handleSprudelFilterClick}" .ghost=${this.filter.isSprudel} icon="wine-bubble" size="small"></kellermeister-button>
                <kellermeister-button text="Rot" @click="${this.handleRedFilterClick}" .ghost=${this.filter.isRed} icon="wine-red" size="small"></kellermeister-button>
                <kellermeister-button text="Weiss" @click="${this.handleWhiteFilterClick}" .ghost=${this.filter.isWhite} icon="wine-white" size="small"></kellermeister-button>
                <kellermeister-button text="Rosé" @click="${this.handleRoseFilterClick}" .ghost=${this.filter.isRose} icon="wine-rose" size="small"></kellermeister-button>
            </div>
            <main>
                <div>
                    ${this.orders.size > 0
                            ? html`
                                ${[...this.orders.keys()].map(
                                        month => html`
                                            <orders-component .month="${month}" .orders="${this.orders.get(month)}">`
                                )}
                            `
                            : html`
                                <p>Es gibt noch keine Bestellungen.</p>
                            `
                    }
                </div>
            </main>
            <footer>
                <kellermeister-footer></kellermeister-footer>
            </footer>
        `;
    }

    private async handleSprudelFilterClick(): Promise<void> {
        this.filter.toggleSprudelFilter();
        await this.fetchOrders();
    }

    private async handleRedFilterClick(): Promise<void> {
        this.filter.toggleRedFilter();
        await this.fetchOrders();
    }

    private async handleWhiteFilterClick(): Promise<void> {
        this.filter.toggleWhiteFilter();
        await this.fetchOrders();
    }

    private async handleRoseFilterClick(): Promise<void> {
        this.filter.toggleRoseFilter();
        await this.fetchOrders();
    }

    // private handleTextFilterClick(): void {
    //     if (this.showSearchInput) {
    //         this.showSearchInput = false;
    //     } else {
    //         this.searchText = this.filter.textFilter?.toString() ?? '';
    //         this.showSearchInput = true;
    //     }
    // }

}

declare global {
    interface HTMLElementTagNameMap {
        'order-page': OrderPage;
    }
}