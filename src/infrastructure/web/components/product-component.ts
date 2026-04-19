import {css, html, nothing} from "lit";
import {customElement, property} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import type {Product} from "../../../domain/Product/Product.ts";

@customElement('product-component')
class ProductComponent extends BaseComponent {

    @property()
    product: Product | undefined;

    constructor() {
        super();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .expanded {
                    background: var(--km-bg, #F7F5F1);
                    border-top: 1px solid var(--km-border, #E4DFD7);
                    padding: 4px 0 8px;
                }

                .group {
                    display: grid;
                    grid-template-columns: 130px 1fr;
                    gap: 4px;
                    padding: 8px 16px;
                    align-items: baseline;
                }

                label {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: var(--km-text-muted, #8A8278);
                }

                .value {
                    font-size: 14px;
                    color: var(--km-text, #1A1917);
                    font-weight: 400;
                }
            `
        ];
    }

    protected render() {
        return html`
            <div class="expanded">
                <div class="group">
                    <label>Preis / Flasche</label>
                    <span class="value"><slot></slot></span>
                </div>
                <div class="group">
                    <label>Jahrgang</label>
                    <span class="value">${this.renderDate(this.product?.productionDate)}</span>
                </div>
                <div class="group">
                    <label>Flaschengrösse</label>
                    <span class="value">${this.product?.milliliter ? `${this.product.milliliter} ml` : ''}</span>
                </div>
                <div class="group">
                    <label>Weinart</label>
                    <span class="value">${this.product?.weinart}</span>
                </div>
                <div class="group">
                    <label>Weinfarbe</label>
                    <span class="value">${this.product?.weinfarbe}</span>
                </div>
                <div class="group">
                    <label>Region</label>
                    <span class="value">${this.product?.region}</span>
                </div>
                <div class="group">
                    <label>Land</label>
                    <span class="value">${this.product?.land}</span>
                </div>
                <div class="group">
                    <label>Traubensorte</label>
                    <span class="value">${this.product?.traubensorte}</span>
                </div>
                <div class="group">
                    <label>Klassifikation</label>
                    <span class="value">${this.product?.klassifikation}</span>
                </div>
                <div class="group">
                    <label>Alkohol</label>
                    <span class="value">${this.product?.alkoholgehalt}</span>
                </div>
                <div class="group">
                    <label>Ausbau</label>
                    <span class="value">${this.product?.ausbau}</span>
                </div>
                <div class="group">
                    <label>Biologisch</label>
                    <span class="value">${this.product?.biologisch}</span>
                </div>
                <div class="group">
                    <label>Trinkfenster</label>
                    <span class="value">${this.renderYear(this.product?.trinkfensterVon)} – ${this.renderYear(this.product?.trinkfensterBis)}</span>
                </div>
                <div class="group">
                    <label>Quelle</label>
                    <span class="value">${this.product?.orderItem?.order?.seller?.name}${this.renderDate(this.product?.orderItem?.order?.orderDate)}</span>
                </div>
            </div>
        `
    }

    private renderYear(date: Date | undefined) {
        return html`${date?.getFullYear()}`;
    }

    private renderDate(date: Date | undefined) {
        return html`${date? 
            html`, ${date?.getDay()}.${date?.getMonth()}.${date?.getFullYear()}`
            : nothing
        }`;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'product-component': ProductComponent;
    }
}
