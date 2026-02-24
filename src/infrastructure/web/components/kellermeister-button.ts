import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import iconQRCode from '../images/icons/qr-code.svg?raw';
import iconArrowLeft from '../images/icons/arrow-left.svg?raw';
import iconTrash from '../images/icons/trash.svg?raw';
import iconArrowRight from '../images/icons/arrow-right.svg?raw';
import iconMonitorPlay from '../images/icons/monitor-play.svg?raw';
import iconShare from '../images/icons/share2.svg?raw';
import iconOk from '../images/icons/check.svg?raw';
import iconCancel from '../images/icons/cross.svg?raw';
import iconHouse from '../images/icons/house.svg?raw';
import iconWallet from '../images/icons/wallet.svg?raw';
import iconProfile from '../images/icons/settings.svg?raw';
import iconPlus from '../images/icons/plus.svg?raw';
import iconWineShelf from '../images/icons/wine-shelf.svg?raw';
import iconWork from '../images/icons/hand-coins.svg?raw';
import iconLogout from '../images/icons/hiker.svg?raw';
import iconWineRed from '../images/icons/wine-red.svg?raw';
import iconWineWhite from '../images/icons/wine-white.svg?raw';
import iconWineRose from '../images/icons/wine-rose.svg?raw';
import iconWineBubble from '../images/icons/wine-white.svg?raw';
import iconSearch from '../images/icons/search.svg?raw';
import iconShopping from '../images/icons/shopping.svg?raw';

import { BaseComponent } from '../common/base-component.js';

type IconType = 'scan' | 'delete' | 'back' | 'goto' | 'demo' | 'share' | 'ok' | 'cancel' | 'house' | 'wallet' | 'profile' | 'plus' | 'wine-shelf' | 'work' | 'logout'| 'wine-red' | 'wine-white' | 'wine-rose' | 'wine-bubble' | 'search' | 'shopping' | 'trash';

@customElement('kellermeister-button')
class KellermeisterButton extends BaseComponent {

  @property()
  size: 'small' | 'large' | 'normal' = 'normal';

  @property({ type: Boolean })
  cta = false;

  @property({ type: Boolean })
  ghost = false;

  @property()
  icon?: IconType = undefined;

  @property()
  text = '';

  render() {
    return html`
      <button
        aria-labelledby="${ifDefined(this.text ? 'label' : undefined)}"
        class="${classMap({
          button: true,
          [this.size]: true,
          cta: this.cta,
          ghost: this.ghost,
        })}"
      >
        ${this.renderIcon()}
      </button>
      ${this.text ? html`<div class="label" id="label">${this.text}</div>` : nothing}
    `;
  }

  static get styles() {
    return [
        ...super.styles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Visual correction so the share icon looks more centered */
        :host([icon='share']) svg {
          transform: translateX(-2px);
        }

        .button {
          border-radius: 50%;
          width: 64px;
          height: 64px;
          display: flex;
          border: none;
          cursor: pointer;
        }

        .button:hover,
        .button.cta {
          box-shadow: 0 0 0 0 rgb(from var(--app-color-primary) r g b / 0.5);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          70% {
            box-shadow: 0 0 0 15px rgba(0, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }

        .button.ghost {
          background: transparent;
          border: 1px solid var(--app-color-primary);
        }

        .button.ghost svg path,
        .button.ghost svg circle {
          color: var(--app-color-primary);
          stroke: var(--app-color-primary);
        }

        .button.large {
          width: 100px;
          height: 100px;
        }

        .button.small {
          width: 48px;
          height: 48px;
        }

        .button.large svg {
          width: 64px;
        }

        .button.small svg {
          width: 32px;
          height: 32px;
        }

        svg {
          margin: auto;
          width: 42px;
        }
        
        svg path {
          stroke: var(--app-color-primary);
        }

        .label {
          color: var(--app-primary-on-white-background);
        }
      `
    ];
  }

  private renderIcon() {
    switch (this.icon) {
      case 'scan':
        return unsafeHTML(iconQRCode);
      case 'delete':
        return unsafeHTML(iconTrash);
      case 'back':
        return unsafeHTML(iconArrowLeft);
      case 'goto':
        return unsafeHTML(iconArrowRight);
      case 'house':
        return unsafeHTML(iconHouse);
      case 'demo':
        return unsafeHTML(iconMonitorPlay);
      case 'share':
        return unsafeHTML(iconShare);
      case 'ok':
        return unsafeHTML(iconOk);
      case 'cancel':
        return unsafeHTML(iconCancel);
      case 'wallet':
        return unsafeHTML(iconWallet);
      case 'profile':
        return unsafeHTML(iconProfile);
      case 'plus':
        return unsafeHTML(iconPlus);
      case 'wine-shelf':
        return unsafeHTML(iconWineShelf);
      case 'work':
        return unsafeHTML(iconWork);
      case 'logout':
        return unsafeHTML(iconLogout);
      case 'wine-red':
        return unsafeHTML(iconWineRed);
      case 'wine-white':
        return unsafeHTML(iconWineWhite);
      case 'wine-rose':
        return unsafeHTML(iconWineRose);
      case 'wine-bubble':
        return unsafeHTML(iconWineBubble);
      case 'search':
        return unsafeHTML(iconSearch);
      case 'shopping':
        return unsafeHTML(iconShopping);
      case 'trash':
        return unsafeHTML(iconTrash);
      default:
        return undefined;
    }
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'kellermeister-button': KellermeisterButton;
  }
}
