import { LitElement, css } from 'lit';

/**
 * Simple base component.
 */
export abstract class BaseComponent extends LitElement {

  static get styles() {
    return [
        css`
            kellermeister-header {
                position: fixed;
                top: 10px;
                left: 12px;
                right: 12px;
                height: 64px;
                background-color: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: 20px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.10);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 16px 8px 16px;
                z-index: 1000;
            }

            kellermeister-footer {
                position: fixed;
                bottom: 10px;
                left: 12px;
                right: 12px;
                height: 64px;
                background-color: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: 20px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.10);
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 0 8px;
                z-index: 1000;
            }

            .button {
                background-color: white;
            }

            main {
                padding: 0 16px;
            }

            .content {
                padding: 0;
                max-width: 600px;
                margin: 0 auto;
            }

            .content h1 {
                font-family: var(--app-font-family-display, Georgia, serif);
                color: var(--km-text, #1A1917);
                margin-bottom: 20px;
                font-size: 28px;
                font-weight: 500;
            }

            .content p {
                color: var(--km-text-muted, #8A8278);
                line-height: 1.7;
                margin-bottom: 15px;
                font-size: 15px;
            }

            .card {
                background: var(--km-surface, #fff);
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 12px;
                border: 1px solid var(--km-border, #E4DFD7);
            }

            .card h2 {
                color: var(--app-color-primary, #3A6B28);
                font-size: 18px;
                margin-bottom: 10px;
            }
        `
    ];
  }

}
