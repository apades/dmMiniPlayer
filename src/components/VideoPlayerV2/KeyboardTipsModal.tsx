import { createIsolationModal } from '@root/hook/useOpenIsolationModal'
import configStore, { saveConfig, updateConfig } from '@root/store/config'
import { isArray } from '@root/utils'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { Fragment } from 'react'
import Modal from '../Modal'
import { t } from '@root/utils/i18n'

type keyDataItem = {
  key: string | string[]
  text: string
  desc?: string
}
const KeyboardTipsModal = createIsolationModal((props) => {
  const keydataList: keyDataItem[] = [
    {
      key: 'Space',
      text: t('shortcut.play/pause'),
    },
    {
      key: '←',
      text: t('shortcut.rewind'),
    },
    {
      key: '→',
      text: t('shortcut.forward'),
    },
    {
      key: ['Shift', '←'],
      text: t('shortcut.rewind_fine'),
    },
    {
      key: ['Shift', '→'],
      text: t('shortcut.forward_fine'),
    },
    {
      key: [t('shortcut.longPress'), '→'],
      text: t('shortcut.speedMode'),
    },
    // {
    //   key: ['ctrl', '→'],
    //   text: '下一个视频',
    // },
    // {
    //   key: ['ctrl', '←'],
    //   text: '上一个视频',
    // },
    {
      key: '↑',
      text: t('shortcut.volumeUp'),
    },
    {
      key: '↓',
      text: t('shortcut.volumeDown'),
    },
    {
      key: 'M',
      text: t('shortcut.mute/unmute'),
    },
    {
      key: '0',
      text: t('shortcut.speedMode/normal'),
    },
    {
      key: '=',
      text: t('shortcut.speedUp'),
    },
    {
      key: '-',
      text: t('shortcut.speedDown'),
    },
    {
      key: 'Enter',
      text: t('shortcut.popupDanmakuInput'),
    },
    {
      key: ['Shift', 'P'],
      text: t('shortcut.screenshot'),
    },
    {
      key: 'D',
      text: t('shortcut.show/hideDanmaku'),
    },
    {
      key: 'S',
      text: t('shortcut.show/hideSubtitle'),
    },
  ]

  return (
    <Modal isOpen={props.isOpen} onClose={props.destroy}>
      <div className="[&_th]:bor-[#dee2e6] [&_td]:bor-[#dee2e6] [&_td]:px-4 [&_td]:py-2 p-4">
        <div className="f-i-center gap-4 mb-2">
          <input
            type="checkbox"
            checked={configStore.keyboardTips_show}
            onChange={(e) => {
              const visible = e.target.checked
              updateConfig({ keyboardTips_show: visible })
              saveConfig()
            }}
          />
          {t('shortcut.showShortcutTips')}
        </div>
        <table border={1}>
          <thead>
            <tr>
              <th>{t('shortcut.shortcut')}</th>
              <th>{t('shortcut.feat')}</th>
            </tr>
          </thead>
          <tbody>
            {keydataList.map((item, i) => {
              const kbds = isArray(item.key) ? item.key : [item.key]
              return (
                <tr key={i}>
                  <td>
                    {kbds.map((v, i) => {
                      const isLast = i === kbds.length - 1
                      return (
                        <Fragment>
                          <kbd className="shadow-sm bor-[#b4b4b4] rounded font-bold px-2 py-0.5 font-[monospace] leading-[1]">
                            {v}
                          </kbd>
                          {isLast ? '' : ' + '}
                        </Fragment>
                      )
                    })}
                  </td>
                  <td>{item.text}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  )
})

export default observer(KeyboardTipsModal)
