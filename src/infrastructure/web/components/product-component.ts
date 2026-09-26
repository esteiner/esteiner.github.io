import {css, html, nothing} from "lit";
import {customElement, property} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import type {Product} from "../../../domain/Product/Product.ts";
import type {Rating} from "../../../domain/Product/Rating.ts";
import {CDI} from "../../cdi/CDI.ts";

@customElement('product-component')
class ProductComponent extends BaseComponent {

    @property()
    product: Product | undefined;

    /** When true, editable detail fields render as inputs (set by bottle-component). */
    @property({type: Boolean})
    editing: boolean = false;

    /** Whether the model has unpersisted edits (persist on commit / on removal). */
    private dirty: boolean = false;

    constructor() {
        super();
    }

    disconnectedCallback(): void {
        // Collapsing removes this component; flush a pending edit that was written
        // to the model but not yet committed via a field's change event.
        this.persist();
        super.disconnectedCallback();
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

                .edit-input {
                    font-family: var(--app-font-family, 'DM Sans', sans-serif);
                    font-size: 14px;
                    color: var(--km-text, #1A1917);
                    width: 100%;
                    box-sizing: border-box;
                    padding: 4px 8px;
                    border: 1.5px solid var(--km-border, #E4DFD7);
                    border-radius: 6px;
                    background: var(--km-surface, white);
                    outline: none;
                }

                .edit-input:focus {
                    border-color: var(--app-color-primary, #3A6B28);
                }

                .value.range {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }

                .value.range .edit-input {
                    width: 5em;
                }
            `
        ];
    }

    protected render() {
        const p = this.product;
        return html`
            <div class="expanded">
                <div class="group">
                    <label>Preis / Flasche</label>
                    ${this.editing
                        ? this.numberInput(p?.getPrice(), (v) => p?.setPrice(v))
                        : html`<span class="value"><slot></slot></span>`}
                </div>
                <div class="group">
                    <label>Hersteller</label>
                    ${this.textField(p?.getProducer(), (v) => { p?.setProducer(v); this.deriveName(); })}
                </div>
                <div class="group">
                    <label>Weinname</label>
                    ${this.textField(p?.getWineName(), (v) => { p?.setWineName(v); this.deriveName(); })}
                </div>
                <div class="group">
                    <label>Jahrgang</label>
                    ${this.editing
                        ? this.yearInput(p?.getProductionDate(), (d) => { p?.setProductionDate(d); this.deriveName(); })
                        : html`<span class="value">${this.renderYear(p?.getProductionDate())}</span>`}
                </div>
                <div class="group">
                    <label>Flaschengrösse</label>
                    ${this.editing
                        ? this.numberInput(p?.getVolumeMl(), (v) => p?.setVolumeMl(v))
                        : html`<span class="value">${p?.getVolumeMl() ? `${p?.getVolumeMl()} ml` : ''}</span>`}
                </div>
                <div class="group">
                    <label>Weinart</label>
                    ${this.textField(p?.getWineType(), (v) => p?.setWineType(v))}
                </div>
                <div class="group">
                    <label>Weinfarbe</label>
                    ${this.textField(p?.getWineColor(), (v) => p?.setWineColor(v))}
                </div>
                <div class="group">
                    <label>Region</label>
                    ${this.textField(p?.getRegion(), (v) => p?.setRegion(v))}
                </div>
                <div class="group">
                    <label>Land</label>
                    ${this.textField(p?.getCountry(), (v) => p?.setCountry(v))}
                </div>
                <div class="group">
                    <label>Traubensorte</label>
                    ${this.textField(p?.getGrapeVariety(), (v) => p?.setGrapeVariety(v))}
                </div>
                <div class="group">
                    <label>Klassifikation</label>
                    ${this.textField(p?.getClassification(), (v) => p?.setClassification(v))}
                </div>
                <div class="group">
                    <label>Alkohol</label>
                    ${this.textField(p?.getAlcoholContent(), (v) => p?.setAlcoholContent(v))}
                </div>
                <div class="group">
                    <label>Ausbau</label>
                    ${this.textField(p?.getProduction(), (v) => p?.setProduction(v))}
                </div>
                <div class="group">
                    <label>Biologisch</label>
                    ${this.textField(p?.getOrganic(), (v) => p?.setOrganic(v))}
                </div>
                <div class="group">
                    <label>Trinkfenster</label>
                    ${this.editing
                        ? html`<span class="value range">
                            ${this.yearInput(p?.getDrinkingWindowFrom(), (d) => p?.setDrinkingWindowFrom(d))}
                            –
                            ${this.yearInput(p?.getDrinkingWindowTo(), (d) => p?.setDrinkingWindowTo(d))}
                          </span>`
                        : html`<span class="value">${this.renderYear(p?.getDrinkingWindowFrom())} – ${this.renderYear(p?.getDrinkingWindowTo())}</span>`}
                </div>
                <div class="group">
                    <label>Quelle</label>
                    <span class="value">${p?.getOrderItem()?.getOrder()?.getSeller()?.getName()}${this.renderDate(p?.getOrderItem()?.getOrder()?.getOrderDate())}</span>
                </div>
                ${this.renderRatings()}
            </div>
        `
    }

    /** A string field: read-only span, or a text input that writes through on input. */
    private textField(value: string | undefined, setter: (value: string) => void) {
        if (!this.editing) {
            return html`<span class="value">${value}</span>`;
        }
        return html`<input
            class="value edit-input"
            type="text"
            .value="${value ?? ''}"
            @input="${(e: Event) => this.writeThrough(() => setter((e.target as HTMLInputElement).value))}"
            @change="${this.persist}"
        >`;
    }

    private numberInput(value: number | undefined, setter: (value: number) => void) {
        return html`<input
            class="value edit-input"
            type="number"
            .value="${value != null ? String(value) : ''}"
            @input="${(e: Event) => this.writeThrough(() => {
                const raw = (e.target as HTMLInputElement).value;
                const n = Number(raw);
                if (raw !== '' && !Number.isNaN(n)) setter(n);
            })}"
            @change="${this.persist}"
        >`;
    }

    private yearInput(date: Date | undefined, setter: (date: Date | undefined) => void) {
        return html`<input
            class="value edit-input"
            type="number"
            .value="${date ? String(date.getFullYear()) : ''}"
            @input="${(e: Event) => this.writeThrough(() => {
                const raw = (e.target as HTMLInputElement).value;
                const year = parseInt(raw, 10);
                setter(Number.isNaN(year) ? undefined : new Date(year, 0, 1));
            })}"
            @change="${this.persist}"
        >`;
    }

    /**
     * Apply a setter to the model instantly, mark the model dirty, and notify
     * the parent (bottle-component) so its read-only display (name, price)
     * re-renders with the new value.
     */
    private writeThrough(apply: () => void) {
        apply();
        this.dirty = true;
        this.dispatchEvent(new CustomEvent("product-changed", {bubbles: true, composed: true}));
    }

    /**
     * Recompute the product name from Hersteller + Weinname + Jahrgang whenever
     * one of those is edited. The header picks up the new name through the
     * product-changed event dispatched by writeThrough.
     */
    private deriveName() {
        const p = this.product;
        if (!p) return;
        const year = p.getProductionDate()?.getFullYear();
        const parts = [p.getProducer(), p.getWineName(), year]
            .filter((part) => part != null && String(part).trim() !== "");
        p.setName(parts.join(" "));
    }

    /** Persist the model if it has uncommitted edits. */
    private persist = () => {
        if (this.dirty && this.product) {
            this.dirty = false;
            void CDI.getInstance().getKellermeisterService().updateProduct(this.product);
        }
    };

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
