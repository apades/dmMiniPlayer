import { type FC, useState } from 'react'
import { useOnce } from '../hook'
import { sendMessage } from 'webext-bridge/popup'
import Browser from 'webextension-polyfill'
import { t } from '../utils/i18n'
import { createRoot } from 'react-dom/client'
import WebextEvent from '@root/shared/webextEvent'

const errorTypeMap: Record<string, string> = {
  'user-activation': t('popup.tips'),
  'no-video': t('popup.noVideo'),
}

const Page_popup: FC = () => {
  const [errorType, setErrorType] = useState('')

  useOnce(async () => {
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true })
    if (!tabs.length) return
    sendMessage(WebextEvent.requestVideoPIP, null, {
      tabId: tabs[0].id!,
      context: 'content-script',
    }).then((res) => {
      if (res.state === 'ok') return window.close()
      if (res.state === 'error' && res.errType) {
        setErrorType(res.errType)
      }
    })
  })
  return (
    errorType && (
      <div style={{ width: 100, padding: 6 }}>{errorTypeMap[errorType]}</div>
    )
  )
}

createRoot(document.getElementById('app')!).render(<Page_popup />)
