import { type FC, useState } from 'react'
import { useOnce } from '../hook'
import { sendMessage } from 'webext-bridge/popup'
import Browser from 'webextension-polyfill'
import { t } from '../utils/i18n'
import { createRoot } from 'react-dom/client'

const Page_popup: FC = () => {
  let [isClickError, setClickError] = useState(false)
  useOnce(async () => {
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true })
    if (!tabs.length) return
    sendMessage(
      'player-startPIPPlay',
      {
        name: 'player-startPIPPlay',
      },
      {
        tabId: tabs[0].id,
        context: 'content-script',
      }
    ).then((res: any) => {
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
      <div style={{ width: 100, padding: 6 }}>{t('popup.tips')}</div>
    )
  )
}

createRoot(document.getElementById('app')).render(<Page_popup />)
