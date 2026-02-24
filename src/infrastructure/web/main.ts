// This is the entry file used in createHtmlPlugin of vite.config.ts.

import {getBuildVersion} from './utils.ts';
// Routing
import {initRouter} from './router.ts';
import {setEngine} from "soukai";
import {bootSolidModels, SolidEngine} from "soukai-solid";
import {CDI} from "../cdi/CDI.ts";


// ife for bootstrapping
void (async () => {

    // Output build version
    console.info(`Kellermeister Version: ${getBuildVersion()}`);

    try {
        // initialize router
        await initRouter(document.querySelector('kellermeister-app')!);
    } catch (e) {
        console.error('Could not initialize application.', e);
    }

    // Initialize Soukai Solid
    setEngine(new SolidEngine(CDI.getInstance().getSolidService().getAuthenticatedFetch()));
    bootSolidModels();

    //
    await CDI.getInstance().getSolidService().restoreSession();
})();

// This is needed because of the isolatedModules flag in tsconfig.json
// @see https://vitejs.dev/guide/features.html#typescript-compiler-options
export {};