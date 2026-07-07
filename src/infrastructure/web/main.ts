// This is the entry file used in createHtmlPlugin of vite.config.ts.

import {getBuildVersion} from './utils.ts';
// Routing
import {initRouter} from './router.ts';
import {IndexedDBEngine, setEngine} from "soukai";
import {bootSolidModels} from "soukai-solid";
import {CDI} from "../cdi/CDI.ts";
import {ConnectivityMonitor} from "../solid/ConnectivityMonitor.ts";


// ife for bootstrapping
void (async () => {

    // Output build version
    console.info(`Kellermeister Version: ${getBuildVersion()}`);

    // Local-first: the global engine is IndexedDB, so all ordinary reads/writes
    // are local and offline-capable. The Pod is reached only by the sync layer
    // via a scoped `withEngine(SolidEngine, …)`.
    bootSolidModels();
    setEngine(new IndexedDBEngine("kellermeister"));

    try {
        // initialize router
        await initRouter(document.querySelector('kellermeister-app')!);
    } catch (e) {
        console.error('Could not initialize application.', e);
    }

    // Restore any existing Solid session (login is NOT required to use the app).
    await CDI.getInstance().getSolidService().restoreSession();

    // On reconnect, retry syncing (skipped silently if there is no session).
    const connectivity = new ConnectivityMonitor(() => CDI.getInstance().getReconnectSync().run());
    connectivity.start();
})();

// This is needed because of the isolatedModules flag in tsconfig.json
// @see https://vitejs.dev/guide/features.html#typescript-compiler-options
export {};