import {customElement} from "lit/decorators.js";
import {BaseComponent} from "../common/base-component.ts";
import {css, html} from "lit";

@customElement('kellermeister-wine-filter')
class KellermeisterWineFilter extends BaseComponent {

    static get styles() {
        return [
            ...super.styles,
            css`
                .kellermeister-wine-filter {
                    display: flex;
                    flex: 1;
                    align-content: center;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .overlay {
                    position: sticky;
                    top: 1rem;
                    left: 1rem;
                    height: 0;
                    z-index: 99;
                    transition: opacity 1s linear;
                    opacity: 1;
                    margin: 1rem auto 0 1rem;
                }
            `
        ];
    }

    render() {
        return html`
          <div class="kellermeister-wine-filter">
              <kellermeister-button text="Sprudel" @click="${this.handleFilterClick}" icon="wine-bubble" size="small"></kellermeister-button>
              <kellermeister-button text="Rot" @click="${this.handleFilterClick}" icon="wine-red" size="small"></kellermeister-button>
              <kellermeister-button text="Weiss" @click="${this.handleFilterClick}" icon="wine-white" size="small"></kellermeister-button>
              <kellermeister-button text="Rosé" @click="${this.handleFilterClick}" icon="wine-rose" size="small"></kellermeister-button>
          </div>
        `;
    }

    private handleFilterClick() {
        console.log("handleLogoutClick")
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'kellermeister-wine-filter': KellermeisterWineFilter;
    }
}