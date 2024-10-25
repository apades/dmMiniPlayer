import { FC, useContext, useRef, useState } from 'react'
import Dropdown from '../Dropdown'
import { useMemoizedFn } from 'ahooks'
import vpContext from './context'
import { observer } from 'mobx-react'
import classNames from 'classnames'
import Iconfont from '../Iconfont'
import { useToast, toast } from 'react-toastify'
import { runInAction } from 'mobx'
import { handleOnPressEnter } from '../VideoPlayer/utls'

const Menu: FC = observer((props) => {
  const { danmakuEngine } = useContext(vpContext)
  if (!danmakuEngine) return

  const urlInputRef = useRef<HTMLInputElement>(null)
  const [isCustom, setCustom] = useState(false)
  const [isDownloading, setDownloading] = useState(false)

  if (!isCustom)
    return (
      <div>
        <h3>加载自定义弹幕</h3>
        <p>从url加载</p>
        <div className="f-i-center">
          <input
            disabled={isDownloading}
            ref={urlInputRef}
            onKeyDown={handleOnPressEnter((e) => {
              const val = (e.target as HTMLInputElement).value
            })}
          />
        </div>
        <p>弹幕时间差</p>
        <input
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

  const Menu = useMemoizedFn(() => {
    return (
      <div className="w-[60px] bg-[#000] rounded-[4px] p-[4px] flex-col gap-[4px] text-[14px] text-white"></div>
    )
  })
  return (
    <Dropdown menuRender={Menu}>
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
