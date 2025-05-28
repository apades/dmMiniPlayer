import { LoadingOutlined } from '@ant-design/icons'
import WebextEvent from '@root/shared/webextEvent'
import { type FC, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { sendMessage } from 'webext-bridge/popup'
import Browser from 'webextension-polyfill'
import { useAction, useOnce } from '../hook'
import { t } from '../utils/i18n'

const errorTypeMap: Record<string, string> = {
  'user-activation': t('popup.tips'),
  'no-video': t('popup.noVideo'),
  'no-support': t('popup.noSupport'),
}

const Page_popup: FC = () => {
  const [errorType, setErrorType] = useState('')
  const [isLoading, startPIP] = useAction(async () => {
    const tabs = await Browser.tabs.query({ active: true, currentWindow: true })
    if (!tabs.length) return
    const tarTab = tabs[0]
    if (!tarTab.url) return setErrorType('no-support')
    if (
      tarTab.url.startsWith('chrome://') ||
      tarTab.url.startsWith('about:') ||
      tarTab.url.startsWith('edge:')
    )
      return setErrorType('no-support')

    await sendMessage(WebextEvent.requestVideoPIP, null, {
      tabId: tarTab.id!,
      context: 'content-script',
    }).then((res) => {
      if (res.state === 'ok') return window.close()
      if (res.state === 'error' && res.errType) {
        setErrorType(res.errType)
      }
    })
  }, true)

  useOnce(() => {
    startPIP()
  })
  if (isLoading) return <LoadingOutlined />

  if (errorType)
    return (
      <div style={{ width: 100, padding: 6 }}>{errorTypeMap[errorType]}</div>
    )

  return <div style={{ width: 100, padding: 6 }}>{t('popup.defaultTips')}</div>
}

createRoot(document.getElementById('app')!).render(<Page_popup />)
