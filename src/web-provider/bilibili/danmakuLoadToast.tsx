import { BiliDanmakuMode } from '@root/store/config/specialWebsites'
import { t } from '@root/utils/i18n'
import toast from 'react-hot-toast'

export function toastBiliDanmakuMode(mode: BiliDanmakuMode) {
  toast(
    mode === BiliDanmakuMode.html
      ? t('vp.danmakuModeHtml')
      : t('vp.danmakuModeApi'),
  )
}

export function toastBiliDanmakuLoadError(onSwitch: () => void) {
  const id = toast.error(
    <span>
      {t('error.danmakuLoad')}
      <button
        type="button"
        className="ml-1.5 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[#7ecbff] underline"
        onClick={(event) => {
          event.stopPropagation()
          onSwitch()
          toast.dismiss(id)
        }}
      >
        {t('error.switchHtmlDanmaku')}
      </button>
      <button
        type="button"
        className="ml-1.5 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-white/60"
        onClick={(event) => {
          event.stopPropagation()
          toast.dismiss(id)
        }}
      >
        ×
      </button>
    </span>,
    { duration: 12000 },
  )
}
