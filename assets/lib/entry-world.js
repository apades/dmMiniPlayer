(function () {
    'use strict';
    const extBaseUrl = document.documentElement.getAttribute('dm-url');
    if (document.documentElement.getAttribute('dm-disable')) return

    console.log('⚡ run world script')
    ;(async () => {
        await import(extBaseUrl + "world.js");
    })().catch(console.error);

})();
