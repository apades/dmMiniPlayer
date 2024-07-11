(function () {
    'use strict';
    const extBaseUrl = document.documentElement.getAttribute('dm-url');

    console.log('⚡ run world script')
    ;(async () => {
        await import(extBaseUrl + "world.mjs");
    })().catch(console.error);

})();
