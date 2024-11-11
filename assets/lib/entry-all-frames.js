(function () {
    'use strict';
    (async () => {
        if(document.documentElement.getAttribute('dm-disable')) return
        
        await chrome.storage.local.get('LOCALE').then(res => {
            if (!res?.LOCALE) return
            window.__LOCALE = res.LOCALE
        })
        await Promise.all([
            import(chrome.runtime.getURL("clogInject.js")),
            import(chrome.runtime.getURL("main.js"))
        ])
    })().catch(console.error);

})();
