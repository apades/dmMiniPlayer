(function () {
    'use strict';
    (async () => {
        await Promise.all([
            import(chrome.runtime.getURL("clogInject.mjs")),
            import(chrome.runtime.getURL("floatButton.mjs"))
        ]) 
    })().catch(console.error);

})();
