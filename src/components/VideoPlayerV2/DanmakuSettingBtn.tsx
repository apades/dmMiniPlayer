import { FC, useContext, useRef, useState } from 'react'
import Dropdown from '../Dropdown'
import { useMemoizedFn } from 'ahooks'
import vpContext from './context'
import { observer } from 'mobx-react'
import classNames from 'classnames'
import Iconfont from '../Iconfont'
import { runInAction } from 'mobx'
import { handleOnPressEnter } from '../VideoPlayer/utls'
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { useOnce } from '@root/hook'
import WebextEvent from '@root/shared/webextEvent'
import {
  LoadingOutlined,
  CheckOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { getAnyObjToString } from '@root/utils'
import { parserBilibiliDanmuFromXML } from '@pkgs/danmakuGetter/apiDanmaku/bilibili/BilibiliVideo'
import AssParser from '@root/utils/AssParser'

const Menu: FC = observer((props) => {
  const { danmakuEngine, isLive, webVideo } = useContext(vpContext)
  if (!danmakuEngine || !webVideo) return

  const urlInputRef = useRef<HTMLInputElement>(null)
  const [isDownloading, setDownloading] = useState(false)
  const [isDownloaded, setDownloaded] = useState(false)
  const [error, setError] = useState('')
  const getDanmakuId = useRef('')

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

  return (
    <div className="bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px] text-white">
      <h3 className="f-i-center justify-between">
        加载自定义弹幕
        {isDownloading && <LoadingOutlined className="animate-spin" />}
        {isDownloaded && <CheckOutlined />}
      </h3>
      <div className="relative w-full p-1 hover:bg-gray-800 transition-colors cursor-pointer">
        从本地加载
        <input
          className="absolute w-full left-0 top-0 h-full opacity-0 cursor-pointer"
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return

            if (!file.name.endsWith('.ass') && !file.name.endsWith('.xml')) {
              setError('请选择ass或ass文件')
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
        title="目前只支持从bilibili获取弹幕"
      >
        从url加载 <WarningOutlined />
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
        title="目前只有HTML渲染弹幕支持该功能"
      >
        时间差
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
  const { danmakuEngine } = useContext(vpContext)
  if (!danmakuEngine) return

  const visible = danmakuEngine.visible

  return (
    <Dropdown menuRender={() => <Menu />}>
      <div
        className={classNames(
          'p-1 cursor-pointer hover:bg-[#333] rounded-sm transition-colors',
          !visible && 'opacity-50'
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
