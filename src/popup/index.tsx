import { type FC, useState } from 'react'
import { sendMessage } from 'webext-bridge/popup'
import Browser from 'webextension-polyfill'
import { createRoot } from 'react-dom/client'
import WebextEvent from '@root/shared/webextEvent'
import { LoadingOutlined } from '@ant-design/icons'
import logger from '@pkgs/logger/ext'
import { t } from '../utils/i18n'
import { useAction, useOnce } from '../hook'

const popupLogger = logger.namespace('popup')
const UNSUPPORTED_TAB_URL_RE = /^(?:chrome|about|edge):/

const errorTypeMap: Record<string, string> = {
  'user-activation': t('popup.tips'),
  'no-video': t('popup.noVideo'),
  'no-support': t('popup.noSupport'),
}

const Page_popup: FC = () => {
  const [errorType, setErrorType] = useState('')
  const [isLoading, startPIP] = useAction(async () => {
    logger.userAction('popup request picture-in-picture')

    const tabs = await Browser.tabs.query({ active: true, currentWindow: true })
    popupLogger.info('active tabs queried', { count: tabs.length })
    if (!tabs.length) {
      popupLogger.warn('no active tab found')
      return
    }

    const tarTab = tabs[0]
    if (!tarTab.url) {
      popupLogger.warn('active tab has no url', { tabId: tarTab })
      return setErrorType('no-support')
    }
    if (UNSUPPORTED_TAB_URL_RE.test(tarTab.url)) {
      popupLogger.warn('unsupported tab url', {
        tabId: tarTab.id,
        url: tarTab.url,
      })
      return setErrorType('no-support')
    }

    popupLogger.info('request init player from popup', {
      tabId: tarTab.id,
      url: tarTab.url,
    })
    await sendMessage(WebextEvent.requestInitPlayerFromExtPopup, null, {
      tabId: tarTab.id!,
      context: 'content-script',
    }).then((res) => {
      if (res.state === 'ok') {
        popupLogger.info('request init player success')
        return window.close()
      }
      if (res.state === 'error' && res.errType) {
        popupLogger.warn('request init player failed', {
          errType: res.errType,
        })
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
