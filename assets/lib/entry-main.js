(function () {
    'use strict';
    (async () => {
        await import(chrome.runtime.getURL("main.js"));
    })().catch(console.error);

})();
