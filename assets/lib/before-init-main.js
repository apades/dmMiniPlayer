// 用来实现world: main 中chrome.runtime.getURL的效果
document.documentElement.setAttribute('dm-url', chrome.runtime.getURL(''))

chrome.storage.sync.get('LOCAL_CONFIG').then(res => {
    const isDisable = (res.LOCAL_CONFIG?.disable_sites ?? []).find(site => new RegExp(site).test(window.location.href))

    if (!isDisable) return
    document.documentElement.setAttribute('dm-disable', 'true')
})
