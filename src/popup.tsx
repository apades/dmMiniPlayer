import { type FC, useState } from 'react'
import { useOnce } from './hook'
import { sendToContentScript } from '@plasmohq/messaging'
import Browser from 'webextension-polyfill'
import { t } from './utils/i18n'

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
      <div style={{ width: 100, padding: 6 }}>{t('popup.tips')}</div>
    )
  )
}

export default Page_popup
