import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { BasePage } from '../common/base-page.ts';

import { router } from '../router.ts';

@customElement('page-404')
class Page404 extends BasePage {
  static get styles() {
    return [
        ...super.styles,
      css``
    ];
  }

  render() {
    return html`
      <header>
        <eva-logo href="/"></eva-logo>
      </header>
      <main class="content">
        <h1>Page Not Found</h1>
        <p>Page not found. But you can always start fresh on the <a href="${router.urlForPath('/')}">homepage</a>.</p>
      </main>
      <footer>
        <eva-footer></eva-footer>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-404': Page404;
  }
}
