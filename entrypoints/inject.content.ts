export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    import('@root/contents/inject')
  },
  runAt: 'document_start',
  world: 'MAIN',
})
