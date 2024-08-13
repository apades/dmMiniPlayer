import App from './progressBar_App'
import { createElement, dq1, onceCall } from '@root/utils'
import AsyncLock from '@root/utils/AsyncLock'
import { createRoot } from 'react-dom/client'

const trustLock = new AsyncLock()
window.addEventListener('click', () => trustLock.ok())

const root = dq1('#app')!

createRoot(root).render(<App />)

dq1('.to-iframe')!.addEventListener('click', toIframe)
dq1('.to-docpip')!.addEventListener('click', docPIP)

const getStyles = onceCall(() => {
  const styles = document.head.querySelectorAll('style')
  return styles
})
async function docPIP() {
  await trustLock.waiting()
  let pipWindow = await window.documentPictureInPicture.requestWindow()
  window.pipwindow = pipWindow

  let styles = getStyles()
  //   const root = createElement('div')
  pipWindow.document.body.appendChild(root)
  styles.forEach((style) => {
    pipWindow.document.head.appendChild(style)
  })
}

function toIframe() {
  let iframe = dq1('iframe')!
  let styles = getStyles()
  //   const root = createElement('div')
  styles.forEach((style) => {
    iframe.contentWindow!.document.head.appendChild(style)
  })
  iframe.contentWindow!.document.body.appendChild(root)
}
