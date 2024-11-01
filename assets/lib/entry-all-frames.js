(function () {
    'use strict';
    (async () => {
        await Promise.all([
            import(chrome.runtime.getURL("clogInject.js")),
            import(chrome.runtime.getURL("main.js"))
        ]) 
    })().catch(console.error);

})();
