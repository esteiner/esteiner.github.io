import { css } from 'lit';
import { BaseComponent } from './base-component.ts';
import type { WebComponentInterface } from '@vaadin/router';

/**
 * Simple base component for pages
 */
export abstract class BasePage extends BaseComponent implements WebComponentInterface {

  static get styles() {
    return [
        ...super.styles,
      css`
      `
    ];
  }
}
