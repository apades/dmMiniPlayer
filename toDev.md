修改 node_modules/@crxjs/vite-plugin/dist/index.cjs:3271 

const vmAsset = bundle["manifest.json"];
-> 
const vmAsset = bundle[".vite/manifest.json"];