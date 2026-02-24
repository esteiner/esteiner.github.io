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
                top: 0;
                left: 0;
                right: 0;
                height: 90px;
                background-color: transparent;
                backdrop-filter: blur(10px);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 15px;
                z-index: 1000;
            }
            
            kellermeister-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 90px;
                background-color: transparent;
                backdrop-filter: blur(10px);
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 0 10px;
                z-index: 1000;
            }

            .header-btn:active,

            .button {
                background-color: white;
            }

            .content {
                padding: 20px;
                max-width: 600px;
                margin: 0 auto;
            }

            .content h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 28px;
            }

            .content p {
                color: #666;
                line-height: 1.6;
                margin-bottom: 15px;
                font-size: 16px;
            }

            .card {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            .card h2 {
                color: #007aff;
                font-size: 20px;
                margin-bottom: 10px;
            }
        `
    ];
  }

}
