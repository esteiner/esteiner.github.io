/**
 * Watches browser connectivity and invokes a callback when the device comes
 * back online. `navigator.onLine` is only a hint — callers must still handle
 * failures gracefully rather than assume a reconnect means the Pod is reachable.
 */
export class ConnectivityMonitor {
    private readonly handler = (): void => {
        void this.onReconnect();
    };

    constructor(private readonly onReconnect: () => void | Promise<void>) {
    }

    start(): void {
        window.addEventListener("online", this.handler);
    }

    stop(): void {
        window.removeEventListener("online", this.handler);
    }

    isOnline(): boolean {
        return navigator.onLine;
    }
}
