export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    import('@root/contents/main')
  },
  runAt: 'document_end',
})
