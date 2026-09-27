import {css, html} from "lit";
import {customElement, state} from "lit/decorators.js";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {BaseComponent} from "../common/base-component.ts";
import trashIcon from "../images/icons/trash.svg?raw";

/** Width of the revealed delete button, and how far an open row is shifted left. */
const ACTION_WIDTH = 72;
/** Movement before the gesture is locked to horizontal (swipe) or vertical (scroll). */
const LOCK_DISTANCE = 10;

/**
 * Swipe-left-to-delete wrapper for a list row (used by the Altglass cellar page).
 * Dragging the row left reveals a delete button behind its right edge; past half
 * the button width the row stays open, otherwise it snaps back. Vertical drags
 * are left to the browser (`touch-action: pan-y`) so the list still scrolls.
 *
 * Events (bubbling, composed):
 *  - `swipe-open`   — the row was opened
 *  - `swipe-delete` — the delete button was tapped
 */
@customElement('swipe-row')
class SwipeRow extends BaseComponent {

    @state()
    private offset: number = 0;

    @state()
    private dragging: boolean = false;

    private isOpen: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    private startOffset: number = 0;
    private axis: 'x' | 'y' | null = null;
    // True between a pointerdown on this row and its pointerup/cancel.
    private tracking: boolean = false;
    // Set after a horizontal drag so the click that follows pointerup is swallowed.
    private suppressClick: boolean = false;

    static get styles() {
        return [
            ...super.styles,
            css`
                :host {
                    display: block;
                    position: relative;
                    overflow: hidden;
                }

                .actions {
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: ${ACTION_WIDTH}px;
                    display: flex;
                }

                .delete {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    padding: 0;
                    background: #B3261E;
                    color: white;
                    cursor: pointer;
                }

                .delete svg {
                    width: 24px;
                    height: 24px;
                }

                .delete svg path {
                    stroke: currentColor;
                    stroke-width: 4;
                }

                .swipe-content {
                    position: relative;
                    background: var(--km-surface, white);
                    touch-action: pan-y;
                    transition: transform 0.2s ease;
                }

                .swipe-content.dragging {
                    transition: none;
                    user-select: none;
                }
            `
        ];
    }

    protected render() {
        return html`
            <div class="actions">
                <button
                    class="delete"
                    aria-label="Löschen"
                    title="Löschen"
                    tabindex="${this.offset < 0 ? 0 : -1}"
                    @click="${this.handleDelete}"
                >${unsafeHTML(trashIcon)}</button>
            </div>
            <div
                class="swipe-content ${this.dragging ? 'dragging' : ''}"
                style="transform: translateX(${this.offset}px)"
                @pointerdown="${this.handlePointerDown}"
                @pointermove="${this.handlePointerMove}"
                @pointerup="${this.handlePointerEnd}"
                @pointercancel="${this.handlePointerEnd}"
                @click="${{handleEvent: (e: Event) => this.handleContentClick(e), capture: true}}"
            ><slot></slot></div>
        `;
    }

    /** Close the row (no deletion). */
    public close(): void {
        this.isOpen = false;
        this.offset = 0;
    }

    private handlePointerDown(e: PointerEvent) {
        if (!e.isPrimary || e.button !== 0) return;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startOffset = this.offset;
        this.axis = null;
        this.tracking = true;
        // A new gesture: forget a leftover flag from a swipe that ended without a click.
        this.suppressClick = false;
    }

    private handlePointerMove(e: PointerEvent) {
        if (!this.tracking || !e.isPrimary || (e.buttons & 1) === 0) return;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        if (this.axis === null) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < LOCK_DISTANCE) return;
            this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (this.axis === 'x') {
                // Only capture once it's a swipe, so plain taps on the row's own buttons keep working.
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                this.dragging = true;
                this.suppressClick = true;
            }
        }
        if (this.axis === 'x') {
            this.offset = Math.min(0, Math.max(-ACTION_WIDTH, this.startOffset + dx));
        }
    }

    private handlePointerEnd() {
        if (this.axis === 'x') {
            const wasOpen = this.isOpen;
            this.isOpen = this.offset < -ACTION_WIDTH / 2;
            this.offset = this.isOpen ? -ACTION_WIDTH : 0;
            this.dragging = false;
            if (this.isOpen && !wasOpen) {
                this.dispatchEvent(new CustomEvent("swipe-open", {bubbles: true, composed: true}));
            }
        }
        this.axis = null;
        this.tracking = false;
    }

    private handleContentClick(e: Event) {
        if (this.suppressClick) {
            // The click that ends a swipe must not also expand the row or open the rating dialog.
            this.suppressClick = false;
            e.stopPropagation();
            e.preventDefault();
        } else if (this.isOpen) {
            // A tap on an open row only closes it.
            this.close();
            e.stopPropagation();
            e.preventDefault();
        }
    }

    private handleDelete(e: Event) {
        e.stopPropagation();
        this.close();
        this.dispatchEvent(new CustomEvent("swipe-delete", {bubbles: true, composed: true}));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'swipe-row': SwipeRow;
    }
}
