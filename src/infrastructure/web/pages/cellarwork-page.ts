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

    private cdi: CDI = CDI.getInstance();

    constructor() {
        super();
        this.cellars = new Array();
        this.bottles = new Array();
        this.cellarIds = new Array();
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .table {
                    display: grid;
                    grid-template-columns: 60% repeat(var(--cellar-columns, 2), 1fr);
                }

                .header-row,
                .data-row {
                    display: contents;
                }
                
                .header-row span {
                    font-weight: bold;
                    background-color: #f0f0f0;
                    padding: 8px;
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
        this.bottles = await this.cdi.getKellermeisterService().bottlesFromCellar(cellar);
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
            <kellermeister-header>
                Kellerarbeit ${this.sourceCellar?.name}
                <kellermeister-button @click="${this.handleIngestClick}" slot="actions" text="einbuchen" icon="wine-bubble"
                                      size="small"></kellermeister-button>
            </kellermeister-header>
            <main>
                <form @submit="${this.handleIngestClick}">
                    <div class="table" style="--cellar-columns: ${this.cellars.length};">
                        <div class="header-row">
                            <span class="column1">${this.bottles.length} Flaschen zum einbuchen</span>
                            ${repeat(this.cellars, (cellar) => cellar.id, (cellar) =>  html`
                                <span class="column2"><kellermeister-button @click="${() => this.handleCellarClick(cellar.id)}" class="column2" icon="wine-shelf" size="small" text="${cellar.name}"></kellermeister-button></span>
                            `)}
                        </div>
                        <div class="data-row">
                            ${repeat(this.bottles, (bottle) => bottle.id, (bottle, index) =>  html`
                                <span class="column1">
                                    <bottle-component .bottle="${bottle}"></bottle-component>
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

}

declare global {
    interface HTMLElementTagNameMap {
        'cellarwork-page': CellarWorkPage;
    }
}