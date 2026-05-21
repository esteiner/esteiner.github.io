import {css, html, nothing} from "lit";
import {customElement, property} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import type {Product} from "../../../domain/Product/Product.ts";
import type {Rating} from "../../../domain/Product/Rating.ts";

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

                .value.ratings {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .rating-chip {
                    background: var(--km-surface, white);
                    border: 1px solid var(--km-border, #E4DFD7);
                    border-radius: 12px;
                    padding: 2px 10px;
                    font-size: 12px;
                    color: var(--km-text, #1A1917);
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
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
                    <span class="value">${this.renderYear(this.product?.getProductionDate())}</span>
                </div>
                <div class="group">
                    <label>Flaschengrösse</label>
                    <span class="value">${this.product?.getVolumeMl() ? `${this.product?.getVolumeMl()} ml` : ''}</span>
                </div>
                <div class="group">
                    <label>Weinart</label>
                    <span class="value">${this.product?.getWineType()}</span>
                </div>
                <div class="group">
                    <label>Weinfarbe</label>
                    <span class="value">${this.product?.getWineColor()}</span>
                </div>
                <div class="group">
                    <label>Region</label>
                    <span class="value">${this.product?.getRegion()}</span>
                </div>
                <div class="group">
                    <label>Land</label>
                    <span class="value">${this.product?.getCountry()}</span>
                </div>
                <div class="group">
                    <label>Traubensorte</label>
                    <span class="value">${this.product?.getGrapeVariety()}</span>
                </div>
                <div class="group">
                    <label>Klassifikation</label>
                    <span class="value">${this.product?.getClassification()}</span>
                </div>
                <div class="group">
                    <label>Alkohol</label>
                    <span class="value">${this.product?.getAlcoholContent()}</span>
                </div>
                <div class="group">
                    <label>Ausbau</label>
                    <span class="value">${this.product?.getProduction()}</span>
                </div>
                <div class="group">
                    <label>Biologisch</label>
                    <span class="value">${this.product?.getOrganic()}</span>
                </div>
                <div class="group">
                    <label>Trinkfenster</label>
                    <span class="value">${this.renderYear(this.product?.getDrinkingWindowFrom())} – ${this.renderYear(this.product?.getDrinkingWindowTo())}</span>
                </div>
                <div class="group">
                    <label>Quelle</label>
                    <span class="value">${this.product?.getOrderItem()?.getOrder()?.getSeller()?.getName()}${this.renderDate(this.product?.getOrderItem()?.getOrder()?.getOrderDate())}</span>
                </div>
                ${this.renderRatings()}
            </div>
        `
    }

    private renderRatings() {
        const ratings = this.product?.getRatings() ?? [];
        if (ratings.length === 0) {
            return nothing;
        }
        const sorted = [...ratings].sort((a: Rating, b: Rating) => {
            const da = a.getDate()?.getTime() ?? 0;
            const db = b.getDate()?.getTime() ?? 0;
            return db - da;
        });
        return html`
            <div class="group">
                <label>Bewertungen</label>
                <span class="value ratings">
                    ${sorted.map(r => html`
                        <span class="rating-chip">${r.getValue()}${r.getDate() ? html` · ${r.getDate().toLocaleDateString()}` : nothing}</span>
                    `)}
                </span>
            </div>
        `;
    }

    private renderYear(date: Date | undefined) {
        return html`${date?.getFullYear()}`;
    }

    private renderDate(date: Date | undefined) {
        return html`${date? 
            html`, ${date.toLocaleDateString()}`
            : nothing
        }`;
    }

}

declare global {
    interface HTMLElementTagNameMap {
        'product-component': ProductComponent;
    }
}
