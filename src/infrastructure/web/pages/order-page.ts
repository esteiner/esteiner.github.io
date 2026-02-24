import {html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {getDefaultSession, type Session} from "@inrupt/solid-client-authn-browser";
import {BasePage} from "../common/base-page.ts";
import '../components/kellermeister-button.ts';
import '../components/kellermeister-footer.ts';
import "../components/orders-component.ts";
import {Order} from "../../../domain/Order/Order.ts";
import {CDI} from "../../cdi/CDI.ts";

@customElement('order-page')
class OrderPage extends BasePage {

    @property()
    orders: Map<Date, Order[]>;

    @state()
    session: Session = getDefaultSession()

    private cdi: CDI = CDI.getInstance();

    constructor() {
        super();
        this.orders = new Map<Date, Order[]>;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchOrders();
    }

    async fetchOrders() {
        if (this.session.info.isLoggedIn) {
            this.orders = await this.cdi.getKellermeisterService().ordersGroupedByMonth();

        }
    }

    render() {
        return html`
            <kellermeister-header>Kellermeister Einkäufe</kellermeister-header>
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

}

declare global {
    interface HTMLElementTagNameMap {
        'order-page': OrderPage;
    }
}