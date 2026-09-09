/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Endpoint of the order-conversion service (photos -> order Turtle). Empty
     * disables photo capture; the sentinel `MOCKED` returns a fixed built-in
     * order with no network request.
     */
    readonly VITE_ORDER_CONVERSION_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
