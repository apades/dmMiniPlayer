(function () {
    'use strict';
    (async () => {
        await import(chrome.runtime.getURL("main.mjs"));
    })().catch(console.error);

})();
