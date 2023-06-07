import { FC, useState } from 'react'
import { useOnce } from './hook'
import { sendToContentScript } from '@plasmohq/messaging'
import Browser from 'webextension-polyfill'

const Page_popup: FC = (props) => {
  let [isClickError, setClickError] = useState(false)
  useOnce(async () => {
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true })
    if (!tabs.length) return
    sendToContentScript({
      name: 'player-startPIPPlay',
      tabId: tabs[0].id,
    }).then((res) => {
      if (res.state == 'ok') return window.close()
      switch (res.type) {
        case 'click-page': {
          setClickError(true)
          return
        }
      }
    })
  })
  return (
    isClickError && (
      <div style={{ width: 100, padding: 6 }}>
        需要点击下页面才能触发画中画播放
      </div>
    )
  )
}

export default Page_popup
