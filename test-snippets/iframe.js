let iframe = document.createElement('iframe')
iframe.style = `position:fixed;width:${window.innerWidth}px;height:${window.innerHeight}px;top:0;left:0;visibility: hidden;`
iframe.src = ''
document.body.appendChild(iframe)
