import {customElement, property} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import type {Product} from "../../../domain/Product/Product.ts";
import {css, html} from "lit";

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
                label {
                    color: oklch(55.1% 0.027 264.364);
                    font-size: 11px;
                }
                .group {
                    margin: 10px;
                    background-color: whitesmoke;
                }
            `
        ];
    }

    protected render() {
        return html`
            <div class="expanded">
                <div class="group">
                    <label>Preis pro Flasche:</label>
                    <div>
                        <slot></slot>
                    </div>
                </div>
                <div class="group">
                    <label>Jahrgang:</label>
                    <div>${this.renderDate(this.product?.productionDate)}</div>
                </div>
                <div class="group">
                    <label>Menge:</label>
                    <div>${this.product?.milliliter}</div>
                </div>
                <div class="group">
                    <label>Weinart:</label>
                    <div>${this.product?.weinart}</div>
                </div>
                <div class="group">
                    <label>Region:</label>
                    <div>${this.product?.region}</div>
                </div>
                <div class="group">
                    <label>Land:</label>
                    <div>${this.product?.land}</div>
                </div>
                <div class="group">
                    <label>Traubensorte:</label>
                    <div>${this.product?.traubensorte}</div>
                </div>
                <div class="group">
                    <label>Klassifikation:</label>
                    <div>${this.product?.klassifikation}</div>
                </div>
                <div class="group">
                    <label>Alkoholgehalt:</label>
                    <div>${this.product?.alkoholgehalt}</div>
                </div>
                <div class="group">
                    <label>Ausbau:</label>
                    <div>${this.product?.ausbau}</div>
                </div>
                <div class="group">
                    <label>Biologisch:</label>
                    <div>${this.product?.biologisch}</div>
                </div>
                <div class="group">
                    <label>Trinkfenster:</label>
                    <div>${this.renderDate(this.product?.trinkfensterVon)} - ${this.renderDate(this.product?.trinkfensterBis)}</div>
                </div>
            </div>
        `
    }

    private renderDate(date: Date | undefined) {
        return html`
            ${date?.getFullYear()}
        `;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'product-component': ProductComponent;
    }
}