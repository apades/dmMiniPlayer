// 用来实现world: main 中chrome.runtime.getURL的效果
document.documentElement.setAttribute('dm-url', chrome.runtime.getURL(''))

chrome.storage.sync.get('LOCAL_CONFIG').then(res => {
    const config = res.LOCAL_CONFIG
    const isDisable = (config?.disable_sites ?? []).find(site => {
        const isRegex = site.startsWith('/') && site.endsWith('/')
        if (isRegex) return new RegExp(site.match(/^\/(.*)\/$/)[1]).test(window.location.href)
        return window.location.href.includes(site)
    })
    const eventInjectSites = btoa(JSON.stringify(config?.eventInject_sites ?? [
        '/https:\\/\\/live\\.douyin\\.com\\/.*/',
        '/https:\\/\\/www\\.twitch\\.com\\/.*/',
        '/https:\\/\\/www\\.youtube\\.com\\/.*/',
        '/https:\\/\\/www\\.douyu\\.com\\/.*/',
        '/https:\\/\\/www\\.bilibili\\.com\\/.*/',
    ]))
    document.documentElement.setAttribute('dm-event-inject-sites', eventInjectSites)

    if (!isDisable) return
    document.documentElement.setAttribute('dm-disable', 'true')
})
