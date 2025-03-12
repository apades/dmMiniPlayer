import {
  CheckOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { parserBilibiliDanmuFromXML } from '@pkgs/danmakuGetter/apiDanmaku/bilibili/BilibiliVideo'
import { PlayerEvent } from '@root/core/event'
import { useOnce } from '@root/hook'
import { useReactBrowserSyncStorage } from '@root/hook/browserStorage'
import { DANMAKU_VISIBLE } from '@root/shared/storeKey'
import WebextEvent from '@root/shared/webextEvent'
import { getAnyObjToString } from '@root/utils'
import AssParser from '@root/utils/AssParser'
import { t } from '@root/utils/i18n'
import { setBrowserSyncStorage } from '@root/utils/storage'
import { useMemoizedFn } from 'ahooks'
import classNames from 'classnames'
import { isUndefined } from 'lodash-es'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { FC, useContext, useEffect, useRef, useState } from 'react'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import Dropdown from '../../Dropdown'
import Iconfont from '../../Iconfont'
import { handleOnPressEnter } from '../../VideoPlayer/utls'
import vpContext from '../context'

const Menu: FC = observer((props) => {
  const { danmakuEngine, isLive, webVideo } = useContext(vpContext)
  if (!danmakuEngine || !webVideo) return

  const urlInputRef = useRef<HTMLInputElement>(null)
  const [isDownloading, setDownloading] = useState(false)
  const [isDownloaded, setDownloaded] = useState(false)
  const [error, setError] = useState('')
  const getDanmakuId = useRef('')
  const [isInitd, setInitd] = useState(false)

  useOnce(() => {
    const unListenGetDanmaku = onMessage(WebextEvent.getDanmaku, ({ data }) => {
      if (data.data) {
        if (isLive) {
          danmakuEngine.addDanmakus(data.data)
        } else {
          danmakuEngine.setDanmakus(data.data)
        }
        setDownloading(false)
        setDownloaded(true)
      }
      if (data.config?.duration) {
        runInAction(() => {
          if (!data.config?.duration) return
          danmakuEngine.timeOffset = +(
            data.config.duration - webVideo.duration
          ).toFixed(2)
        })
      }
      if (data.err) {
        setError(data.err)
      }
    })

    return () => {
      unListenGetDanmaku()
      sendMessage(WebextEvent.stopGetDanmaku, {
        id: getDanmakuId.current,
      })
    }
  })

  const handleDownloadDanmakus = useMemoizedFn(async (url: string) => {
    sendMessage(WebextEvent.setGetDanmaku, { url }).then((res) => {
      getDanmakuId.current = res.id
    })
    setDownloading(true)
  })

  useReactBrowserSyncStorage(DANMAKU_VISIBLE, (val) => {
    if (isUndefined(val)) return
    runInAction(() => {
      danmakuEngine.visible = val
    })
  })

  useEffect(() => {
    if (!isInitd) {
      setInitd(true)
      return
    }
    setBrowserSyncStorage(DANMAKU_VISIBLE, danmakuEngine.visible)
  }, [danmakuEngine.visible])

  return (
    <div className="bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px] text-white">
      <h3 className="f-i-center justify-between">
        {t('vp.loadCustomDanmaku')}
        {isDownloading && <LoadingOutlined className="animate-spin" />}
        {isDownloaded && <CheckOutlined />}
      </h3>
      <div className="relative w-full p-1 hover:bg-gray-800 transition-colors cursor-pointer">
        {t('vp.fromLocal')}
        <input
          className="absolute w-full left-0 top-0 h-full opacity-0 cursor-pointer"
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return

            if (!file.name.endsWith('.ass') && !file.name.endsWith('.xml')) {
              setError(t('vp.danmakuFileError'))
              return
            }

            const reader = new FileReader()
            reader.readAsText(file)
            reader.onload = () => {
              try {
                const text = reader.result as string
                if (file.name.endsWith('.xml')) {
                  const danmakus = parserBilibiliDanmuFromXML(text)
                  danmakuEngine.setDanmakus(danmakus)
                }

                if (file.name.endsWith('.ass')) {
                  danmakuEngine.setDanmakus(new AssParser(text).dans)
                }

                setDownloaded(true)
              } catch (error: any) {
                getAnyObjToString(error) && setError(getAnyObjToString(error))
              }
            }
          }}
          accept=".ass, .xml"
        />
      </div>
      <p
        className="f-i-center justify-between"
        title={t('vp.getDanmakuFromUrlTips')}
      >
        {t('vp.getDanmakuFromUrl')} <WarningOutlined />
      </p>
      <div className="f-i-center">
        <input
          className="bg-inherit bor-[#fff7]"
          disabled={isDownloading}
          ref={urlInputRef}
          onKeyDown={handleOnPressEnter((e) => {
            const val = (e.target as HTMLInputElement).value
            handleDownloadDanmakus(val)
          })}
        />
      </div>
      {error && <p className="text-red-500">ERROR: {error}</p>}
      <p
        className="f-i-center justify-between"
        title={t('vp.danmakuTimeOffsetTips')}
      >
        {t('vp.danmakuTimeOffset')}
        <WarningOutlined />
      </p>
      <input
        className="bg-inherit bor-[#fff7]"
        type="number"
        value={danmakuEngine.timeOffset}
        onChange={(e) => {
          runInAction(() => {
            danmakuEngine.timeOffset = +e.target.value
          })
        }}
      />
    </div>
  )
})

const DanmakuSettingBtn: FC = (props) => {
  const { danmakuEngine, eventBus } = useContext(vpContext)
  if (!danmakuEngine) return

  const visible = danmakuEngine.visible

  useOnce(() =>
    eventBus.on2(PlayerEvent.command_danmakuVisible, () => {
      danmakuEngine.changeVisible()
    }),
  )

  return (
    <Dropdown menuRender={() => <Menu />}>
      <div
        className={classNames(
          'p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors',
          !visible && 'opacity-50',
        )}
        onClick={() => {
          danmakuEngine.changeVisible()
        }}
      >
        <Iconfont size={18} type={visible ? 'danmaku_open' : 'danmaku_close'} />
      </div>
    </Dropdown>
  )
}

export default observer(DanmakuSettingBtn)
