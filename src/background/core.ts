// 用来加载world: MAIN的module type脚本
chrome.scripting.registerContentScripts([
  {
    id: 'beforeInitMain',
    js: ['assets/lib/before-init-main.js'],
    runAt: 'document_start',
    matches: ['<all_urls>'],
  },
  {
    id: 'main',
    js: ['assets/lib/entry-world.js'],
    runAt: 'document_start',
    world: 'MAIN',
    matches: ['<all_urls>'],
  },
])
