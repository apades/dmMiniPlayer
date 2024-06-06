export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    import('@root/contents/floatButton')
  },
  runAt: 'document_end',
  allFrames: true,
})
